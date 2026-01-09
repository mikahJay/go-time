const store = require('../lib/resourceStore')

async function list(req, res) {
  // Support optional owner and tag filtering: `GET /resources?owner=<ownerId>&tag=<tag>`
  const owner = req.query.owner || null
  const tag = req.query.tag || null
  const items = await store.listResources(owner, tag)
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
