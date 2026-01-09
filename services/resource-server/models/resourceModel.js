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
//
// ID generation note:
// - This module uses `crypto.randomUUID()` to generate RFC-4122 v4 UUIDs for
//   resource `id` values. UUID v4 provides ~122 bits of randomness and is
//   generated from Node's CSPRNG; collisions are astronomically unlikely for
//   practical systems but not mathematically impossible.
// - `crypto.randomUUID()` is safe for concurrent use (the underlying RNG is
//   thread-safe). This avoids the race conditions that a shared counter can
//   introduce in multi-threaded or clustered environments.
// - If your application requires an absolute, provable uniqueness guarantee
//   (e.g., to rely on strict DB constraints or cross-system coordination), you
//   should still enforce uniqueness at the persistence layer (unique index in
//   a database) or use a coordinated ID allocator (e.g., Snowflake/ULID with
//   node identifiers) in addition to UUIDs.
// - For most use cases, UUID v4 from `crypto.randomUUID()` is appropriate and
//   preferred over simple counters because it avoids coordination and is
//   globally unique for all practical purposes.

const { randomUUID } = require('crypto')
const store = new Map()

function genId() {
  return `res_${randomUUID()}`
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

function listResources(owner) {
  const all = Array.from(store.values())
  if (owner === undefined || owner === null) return all
  return all.filter((r) => r.owner === owner)
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
}

module.exports = {
  createResource,
  getResource,
  listResources,
  updateResource,
  deleteResource,
  clearStore,
}
