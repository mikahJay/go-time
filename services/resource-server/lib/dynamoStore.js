const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb')

const REGION = process.env.AWS_REGION || 'us-east-1'
const TABLE = process.env.DYNAMO_TABLE || process.env.RESOURCE_TABLE || 'Resources'

// Allow overriding the endpoint (useful for LocalStack) via DYNAMO_ENDPOINT.
const clientConfig = { region: REGION }
if (process.env.DYNAMO_ENDPOINT) clientConfig.endpoint = process.env.DYNAMO_ENDPOINT

const client = new DynamoDBClient(clientConfig)
const ddb = DynamoDBDocumentClient.from(client)
const es = require('./elasticSearch')

function nowIso() {
  return new Date().toISOString()
}

async function createResource(payload = {}) {
  const id = payload.id || `res_${payload.id || require('crypto').randomUUID()}`
  const resource = Object.assign({}, payload, {
    id,
    quantity: Number(payload.quantity) || 0,
    description: payload.description || null,
    // tags stored as list; `tag` is a scalar primary tag for indexing
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    tag: Array.isArray(payload.tags) && payload.tags.length > 0 ? String(payload.tags[0]) : (payload.tag || null),
    metadata: payload.metadata || {},
    owner: payload.owner || null,
    public: (typeof payload.public === 'boolean') ? payload.public : false,
    createdAt: payload.createdAt || nowIso(),
    updatedAt: nowIso(),
  })

  const params = {
    TableName: TABLE,
    Item: resource,
    ConditionExpression: 'attribute_not_exists(id)'
  }

  try {
    await ddb.send(new PutCommand(params))
    // Try to index in Elastic if configured (best-effort)
    try { await es.indexResource(resource) } catch (e) {}
    return resource
  } catch (err) {
    // If conditional check fails, indicate duplicate
    if (err.name === 'ConditionalCheckFailedException') {
      throw new Error('duplicate_id')
    }
    throw err
  }
}

async function getResource(id) {
  const params = { TableName: TABLE, Key: { id } }
  const res = await ddb.send(new GetCommand(params))
  return res.Item || null
}

async function listResources(owner, tag, q) {
  // Note: prefer Query against OwnerIndex when owner is provided.
  const params = { TableName: TABLE }
  const ql = q !== undefined && q !== null ? String(q).toLowerCase().trim() : null
  if (owner !== undefined && owner !== null) {
    // If OwnerIndex exists, prefer Query for efficiency. Support optional tag as sort-key.
    try {
      // Prefer a dedicated owner+tag index when tag is provided.
      const useOwnerTagIndex = (tag !== undefined && tag !== null)
      const qparams = {
        TableName: TABLE,
        IndexName: useOwnerTagIndex ? 'OwnerTagIndex' : 'OwnerIndex',
        KeyConditionExpression: '#owner = :o',
        ExpressionAttributeNames: { '#owner': 'owner' },
        ExpressionAttributeValues: { ':o': owner }
      }
      if (useOwnerTagIndex) {
        qparams.KeyConditionExpression = '#owner = :o AND #tag = :t'
        qparams.ExpressionAttributeNames['#tag'] = 'tag'
        qparams.ExpressionAttributeValues[':t'] = tag
      }
      const qres = await ddb.send(new QueryCommand(qparams))
      // If a free-text query was provided, filter results in JS
      let items = qres.Items || []
      if (ql) {
        items = items.filter((it) => JSON.stringify(it).toLowerCase().includes(ql))
      }
      return items
    } catch (err) {
      // fallback to scan with filters
      const filters = []
      const names = { '#owner': 'owner' }
      const values = { ':o': owner }
      filters.push('#owner = :o')
      if (tag !== undefined && tag !== null) {
        // try to match scalar `tag` attribute or items that contain tag in `tags` list
        names['#tag'] = 'tag'
        values[':t'] = tag
        // prefer scalar equality then fallback to contains on tags
        filters.push('#tag = :t OR contains(#tags, :t)')
        names['#tags'] = 'tags'
      }
      params.FilterExpression = filters.join(' AND ')
      params.ExpressionAttributeNames = names
      params.ExpressionAttributeValues = values
    }
  } else if (tag !== undefined && tag !== null) {
    // No owner provided but tag filter present — use Scan with contains
    params.FilterExpression = 'contains(#tags, :t) OR #tag = :t'
    params.ExpressionAttributeNames = { '#tags': 'tags', '#tag': 'tag' }
    params.ExpressionAttributeValues = { ':t': tag }
  }
  const res = await ddb.send(new ScanCommand(params))
  let items = res.Items || []
  if (ql) {
    // when searching without owner, only return public items
    items = items.filter((it) => {
      if (!owner && !it.public) return false
      try { return JSON.stringify(it).toLowerCase().includes(ql) } catch (e) { return false }
    })
  }
  return items
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

  const params = {
    TableName: TABLE,
    Item: updated
  }

  await ddb.send(new PutCommand(params))
  try { await es.indexResource(updated) } catch (e) {}
  return updated
}

async function deleteResource(id) {
  const params = { TableName: TABLE, Key: { id } }
  await ddb.send(new DeleteCommand(params))
  try { await es.deleteResource(id) } catch (e) {}
  return true
}

async function clearStore() {
  throw new Error('not_supported_in_dynamo')
}

module.exports = {
  createResource,
  getResource,
  listResources,
  updateResource,
  deleteResource,
  clearStore,
}
