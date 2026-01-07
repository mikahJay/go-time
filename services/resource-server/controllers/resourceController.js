const store = require('../lib/resourceStore')

async function list(req, res) {
  const items = await store.listResources()
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
