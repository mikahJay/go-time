// Simple in-memory Resource model and store
// Resource schema:
// {
//   id: string,
//   name: string,
//   type: string,
//   quantity: number,
//   metadata: object,
//   owner: string | null,
//   createdAt: string,
//   updatedAt: string
// }

const store = new Map()
let counter = 1

function genId() {
  return `res_${Date.now()}_${counter++}`
}

function nowIso() {
  return new Date().toISOString()
}

function createResource({ name, type = 'generic', quantity = 1, metadata = {}, owner = null } = {}) {
  const id = genId()
  const resource = {
    id,
    name: name || `resource-${id}`,
    type,
    quantity: Number(quantity) || 0,
    metadata: metadata || {},
    owner: owner || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  store.set(id, resource)
  return resource
}

function getResource(id) {
  return store.get(id) || null
}

function listResources() {
  return Array.from(store.values())
}

function updateResource(id, patch = {}) {
  const existing = store.get(id)
  if (!existing) return null
  const updated = Object.assign({}, existing)
  if (patch.name !== undefined) updated.name = patch.name
  if (patch.type !== undefined) updated.type = patch.type
  if (patch.quantity !== undefined) updated.quantity = Number(patch.quantity)
  if (patch.metadata !== undefined) updated.metadata = patch.metadata
  if (patch.owner !== undefined) updated.owner = patch.owner
  updated.updatedAt = nowIso()
  store.set(id, updated)
  return updated
}

function deleteResource(id) {
  return store.delete(id)
}

function clearStore() {
  store.clear()
  counter = 1
}

module.exports = {
  createResource,
  getResource,
  listResources,
  updateResource,
  deleteResource,
  clearStore,
}
