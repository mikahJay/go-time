// Chooses a backing store implementation based on the RESOURCE_STORE env var.
// Default: in-memory store. To use DynamoDB set `RESOURCE_STORE=dynamo` and
// configure `AWS_REGION` and `DYNAMO_TABLE`.

const storeType = (process.env.RESOURCE_STORE || 'memory').toLowerCase()

let store
if (storeType === 'dynamo' || storeType === 'dynamodb') {
  store = require('./dynamoStore')
} else {
  store = require('./inMemoryStore')
}

module.exports = store
