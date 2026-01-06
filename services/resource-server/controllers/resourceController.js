const model = require('../models/resourceModel')

async function list(req, res) {
  const items = model.listResources()
  res.json(items)
}

async function get(req, res) {
  const id = req.params.id
  const item = model.getResource(id)
  if (!item) return res.status(404).json({ error: 'not_found' })
  res.json(item)
}

async function create(req, res) {
  const payload = req.body || {}
  if (!payload.name) return res.status(400).json({ error: 'missing_name' })
  const created = model.createResource(payload)
  res.status(201).json(created)
}

async function update(req, res) {
  const id = req.params.id
  const patch = req.body || {}
  const updated = model.updateResource(id, patch)
  if (!updated) return res.status(404).json({ error: 'not_found' })
  res.json(updated)
}

async function remove(req, res) {
  const id = req.params.id
  const ok = model.deleteResource(id)
  if (!ok) return res.status(404).json({ error: 'not_found' })
  res.status(204).end()
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
}
