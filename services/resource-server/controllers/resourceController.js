const store = require('../lib/resourceStore')

async function list(req, res) {
  // Support optional owner, tag, and query filtering: `GET /resources?owner=<ownerId>&tag=<tag>&q=<query>`
  const owner = req.query.owner || null
  const tag = req.query.tag || null
  const q = req.query.q || req.query.query || null
  // If ElasticSearch is configured and requested for search, use it for full-text queries
  try {
    if (q && (process.env.RESOURCE_SEARCH || '').toLowerCase() === 'elastic') {
      const es = require('../lib/elasticSearch')
      const items = await es.searchResources(q, owner)
      return res.json(items)
    }
  } catch (e) {
    // fallthrough to store-based search
  }
  const items = await store.listResources(owner, tag, q)
  res.json(items)
}

async function get(req, res) {
  const id = req.params.id
  const item = await store.getResource(id)
  if (!item) return res.status(404).json({ error: 'not_found' })
  res.json(item)
}

async function create(req, res) {
  const payload = req.body || {}
  if (!payload.name) return res.status(400).json({ error: 'missing_name' })
  if (payload.description !== undefined && typeof payload.description !== 'string') {
    return res.status(400).json({ error: 'invalid_description' })
  }
  if (payload.tags !== undefined) {
    if (!Array.isArray(payload.tags) || payload.tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 32)) {
      return res.status(400).json({ error: 'invalid_tags' })
    }
  }
  if (payload.public !== undefined && typeof payload.public !== 'boolean') {
    return res.status(400).json({ error: 'invalid_public' })
  }
  try {
    const created = await store.createResource(payload)
    res.status(201).json(created)
  } catch (err) {
    if (err.message === 'duplicate_id') return res.status(409).json({ error: 'duplicate_id' })
    throw err
  }
}

async function update(req, res) {
  const id = req.params.id
  const patch = req.body || {}
  if (patch.description !== undefined && typeof patch.description !== 'string') {
    return res.status(400).json({ error: 'invalid_description' })
  }
  if (patch.tags !== undefined) {
    if (!Array.isArray(patch.tags) || patch.tags.some(t => typeof t !== 'string' || !t.trim() || t.length > 32)) {
      return res.status(400).json({ error: 'invalid_tags' })
    }
  }
  if (patch.public !== undefined && typeof patch.public !== 'boolean') {
    return res.status(400).json({ error: 'invalid_public' })
  }
  const updated = await store.updateResource(id, patch)
  if (!updated) return res.status(404).json({ error: 'not_found' })
  res.json(updated)
}

async function remove(req, res) {
  const id = req.params.id
  await store.deleteResource(id)
  res.status(204).end()
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
}
