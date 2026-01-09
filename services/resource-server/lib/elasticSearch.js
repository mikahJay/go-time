// Optional ElasticSearch integration helper.
// Exposes: indexResource(resource), deleteResource(id), searchResources(q, owner)
let client = null
const ELASTIC_URL = process.env.ELASTIC_URL || process.env.ELASTICSEARCH_URL || null
try {
  if (ELASTIC_URL) {
    const { Client } = require('@elastic/elasticsearch')
    client = new Client({ node: ELASTIC_URL })
  }
} catch (e) {
  // elastic client not installed or failed to init — we'll gracefully no-op
  client = null
}

async function indexResource(resource = {}) {
  if (!client) return
  try {
    await client.index({ index: 'resources', id: resource.id, refresh: true, body: resource })
  } catch (err) {
    console.warn('elastic: indexResource failed', err && err.message)
  }
}

async function deleteResource(id) {
  if (!client) return
  try {
    await client.delete({ index: 'resources', id, refresh: true })
  } catch (err) {
    // ignore not_found
  }
}

async function searchResources(q, owner) {
  if (!client) return []
  if (!q || String(q).trim().length === 0) return []
  const query = {
    bool: {
      must: [
        {
          multi_match: {
            query: String(q),
            fields: ['name^3', 'description', 'tags', 'metadata.*', 'type']
          }
        }
      ]
    }
  }
  if (owner) {
    // if owner provided, no public restriction
    query.bool.filter = [{ term: { owner } }]
  } else {
    // only public resources for unauthenticated searches
    query.bool.filter = [{ term: { public: true } }]
  }
  try {
    const res = await client.search({ index: 'resources', body: { query, size: 100 } })
    const hits = res.hits && res.hits.hits ? res.hits.hits : []
    return hits.map(h => h._source)
  } catch (err) {
    console.warn('elastic: search failed', err && err.message)
    return []
  }
}

module.exports = {
  indexResource,
  deleteResource,
  searchResources,
}
