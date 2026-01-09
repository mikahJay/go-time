const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb')

const REGION = process.env.AWS_REGION || 'us-east-1'
const TABLE = process.env.DYNAMO_TABLE || process.env.RESOURCE_TABLE || 'Resources'

// Allow overriding the endpoint (useful for LocalStack) via DYNAMO_ENDPOINT.
const clientConfig = { region: REGION }
if (process.env.DYNAMO_ENDPOINT) clientConfig.endpoint = process.env.DYNAMO_ENDPOINT

const client = new DynamoDBClient(clientConfig)
const ddb = DynamoDBDocumentClient.from(client)

function nowIso() {
  return new Date().toISOString()
}

async function createResource(payload = {}) {
  const id = payload.id || `res_${payload.id || require('crypto').randomUUID()}`
  const resource = Object.assign({}, payload, {
    id,
    quantity: Number(payload.quantity) || 0,
    metadata: payload.metadata || {},
    owner: payload.owner || null,
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

async function listResources() {
  // Note: Scan is okay for small datasets / dev. For prod, use queries with indexes.
  const params = { TableName: TABLE }
  const res = await ddb.send(new ScanCommand(params))
  return res.Items || []
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
  updated.updatedAt = nowIso()

  const params = {
    TableName: TABLE,
    Item: updated
  }

  await ddb.send(new PutCommand(params))
  return updated
}

async function deleteResource(id) {
  const params = { TableName: TABLE, Key: { id } }
  await ddb.send(new DeleteCommand(params))
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
