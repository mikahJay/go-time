const { Pool } = require('pg')
const crypto = require('crypto')

// Connection: prefer DATABASE_URL, otherwise use individual PG_* vars.
const connectionString = process.env.DATABASE_URL
  || (process.env.PGHOST ? `postgresql://${process.env.PGUSER || 'postgres'}:${process.env.PGPASSWORD || 'postgres'}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE || 'postgres'}` : null)

// Configure pool. For dev against RDS, enable SSL but allow self-signed certs
const poolConfig = connectionString ? { connectionString } : {}
// If connecting to a remote DB (via connectionString or PGHOST), enable SSL for Postgres
if (connectionString || process.env.PGHOST) {
  poolConfig.ssl = { rejectUnauthorized: false }
}

const pool = new Pool(poolConfig)

// SQL notes (run once to create table):
/*
CREATE TABLE resources (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  owner TEXT,
  tag TEXT,
  public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
CREATE INDEX idx_resources_owner ON resources(owner);
CREATE INDEX idx_resources_owner_tag ON resources(owner, tag);
CREATE INDEX idx_resources_data_gin ON resources USING gin (data);
*/

function nowIso() { return new Date().toISOString() }

async function createResource(payload = {}) {
  const id = payload.id || `res_${crypto.randomUUID()}`
  const resource = Object.assign({}, payload, {
    id,
    quantity: Number(payload.quantity) || 0,
    description: payload.description || null,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    tag: Array.isArray(payload.tags) && payload.tags.length > 0 ? String(payload.tags[0]) : (payload.tag || null),
    metadata: payload.metadata || {},
    owner: payload.owner || null,
    public: (typeof payload.public === 'boolean') ? payload.public : false,
    createdAt: payload.createdAt || nowIso(),
    updatedAt: nowIso(),
  })

  const sql = `INSERT INTO resources(id, data, owner, tag, public, created_at, updated_at) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id`
  const vals = [resource.id, resource, resource.owner, resource.tag, resource.public, resource.createdAt, resource.updatedAt]
  try {
    const res = await pool.query(sql, vals)
    if (!res.rowCount) throw new Error('duplicate_id')
    // best-effort: indexing in external systems can be added here
    return resource
  } catch (err) {
    if (err.code === '23505') throw new Error('duplicate_id')
    throw err
  }
}

async function getResource(id) {
  const res = await pool.query('SELECT data FROM resources WHERE id = $1', [id])
  if (!res.rowCount) return null
  return res.rows[0].data
}

async function listResources(owner, tag, q) {
  const ql = q !== undefined && q !== null ? String(q).toLowerCase().trim() : null
  const params = []
  let where = []
  let idx = 1
  if (owner !== undefined && owner !== null) {
    where.push(`owner = $${idx++}`)
    params.push(owner)
    if (tag !== undefined && tag !== null) {
      where.push(`tag = $${idx++}`)
      params.push(tag)
    }
    if (ql) {
      where.push(`LOWER(data::text) LIKE $${idx++}`)
      params.push(`%${ql}%`)
    }
    const sql = `SELECT data FROM resources ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`
    const res = await pool.query(sql, params)
    return res.rows.map(r => r.data)
  }

  // no owner filter
  if (tag !== undefined && tag !== null) {
    where.push(`(tag = $${idx} OR data->'tags' ? $${idx})`)
    params.push(tag)
    idx++
  }
  if (ql) {
    where.push(`LOWER(data::text) LIKE $${idx++}`)
    params.push(`%${ql}%`)
  }
  // when owner not provided, only return public items
  where.push(`public = true`)

  const sql = `SELECT data FROM resources ${where.length ? 'WHERE ' + where.join(' AND ') : ''}`
  const res = await pool.query(sql, params)
  return res.rows.map(r => r.data)
}

async function updateResource(id, patch = {}) {
  const existing = await getResource(id)
  if (!existing) return null
  const updated = Object.assign({}, existing)
  if (patch.name !== undefined) updated.name = patch.name
  if (patch.type !== undefined) updated.type = patch.type
  if (patch.quantity !== undefined) updated.quantity = Number(patch.quantity)
  if (patch.metadata !== undefined) updated.metadata = patch.metadata
  if (patch.owner !== undefined) updated.owner = patch.owner
  if (patch.description !== undefined) updated.description = patch.description
  if (patch.tags !== undefined) updated.tags = Array.isArray(patch.tags) ? patch.tags : []
  if (patch.tags !== undefined) updated.tag = Array.isArray(patch.tags) && patch.tags.length > 0 ? String(patch.tags[0]) : (patch.tag || null)
  if (patch.public !== undefined) updated.public = typeof patch.public === 'boolean' ? patch.public : Boolean(patch.public)
  updated.updatedAt = nowIso()

  const sql = `UPDATE resources SET data = $1, owner = $2, tag = $3, public = $4, updated_at = $5 WHERE id = $6`
  const vals = [updated, updated.owner, updated.tag, updated.public, updated.updatedAt, id]
  await pool.query(sql, vals)
  return updated
}

async function deleteResource(id) {
  await pool.query('DELETE FROM resources WHERE id = $1', [id])
  return true
}

async function clearStore() {
  await pool.query('TRUNCATE TABLE resources RESTART IDENTITY CASCADE')
  return true
}

module.exports = {
  createResource,
  getResource,
  listResources,
  updateResource,
  deleteResource,
  clearStore,
}
