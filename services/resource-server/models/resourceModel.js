// Simple in-memory Resource model and store
// Resource schema:
// {
//   id: string,
//   name: string,
//   type: string,
//   quantity: number,
//   description?: string,   // optional free-text description
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

function createResource({ name, type = 'generic', quantity = 1, description = null, metadata = {}, owner = null, tags = [], public: isPublic = false } = {}) {
  const id = genId()
  const resource = {
    id,
    name: name || `resource-${id}`,
    type,
    quantity: Number(quantity) || 0,
    description: description || null,
    // tags: optional array of short tag strings; `tag` is a single primary tag used for indexing
    tags: Array.isArray(tags) ? tags.slice(0, 10) : [],
    tag: Array.isArray(tags) && tags.length > 0 ? String(tags[0]) : null,
    metadata: metadata || {},
    owner: owner || null,
    public: typeof isPublic === 'boolean' ? isPublic : false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  store.set(id, resource)
  return resource
}

function getResource(id) {
  return store.get(id) || null
}

function listResources(owner, tag, q) {
  let results = Array.from(store.values())
  if (owner !== undefined && owner !== null) results = results.filter((r) => r.owner === owner)
  if (tag !== undefined && tag !== null) {
    const t = String(tag).toLowerCase()
    results = results.filter((r) => {
      if (r.tag && String(r.tag).toLowerCase() === t) return true
      if (Array.isArray(r.tags)) {
        return r.tags.some(x => String(x).toLowerCase() === t)
      }
      return false
    })
  }
  if (q !== undefined && q !== null) {
    const ql = String(q).toLowerCase().trim()
    if (ql.length > 0) {
      // If owner is not provided, searches only public resources
      results = results.filter((r) => {
        if (!owner) {
          if (!r.public) return false
        }
        try {
          return JSON.stringify(r).toLowerCase().includes(ql)
        } catch (e) {
          return false
        }
      })
    }
  }
  return results
}

function updateResource(id, patch = {}) {
  const existing = store.get(id)
  if (!existing) return null
  const updated = Object.assign({}, existing)
  if (patch.name !== undefined) updated.name = patch.name
  if (patch.type !== undefined) updated.type = patch.type
  if (patch.quantity !== undefined) updated.quantity = Number(patch.quantity)
  if (patch.description !== undefined) updated.description = patch.description
  if (patch.tags !== undefined) updated.tags = Array.isArray(patch.tags) ? patch.tags.slice(0, 10) : []
  // maintain `tag` scalar for indexing (first tag or null)
  if (patch.tags !== undefined) updated.tag = Array.isArray(patch.tags) && patch.tags.length > 0 ? String(patch.tags[0]) : null
  if (patch.public !== undefined) updated.public = typeof patch.public === 'boolean' ? patch.public : Boolean(patch.public)
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
