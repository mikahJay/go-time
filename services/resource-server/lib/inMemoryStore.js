// Adapter that wraps the existing in-memory model to provide a store API
const model = require('../models/resourceModel')

module.exports = {
  async createResource(payload) {
    return model.createResource(payload)
  },
  async getResource(id) {
    return model.getResource(id)
  },
  async listResources() {
    // accept optional owner, tag, and query filters
    const owner = arguments.length > 0 ? arguments[0] : undefined
    const tag = arguments.length > 1 ? arguments[1] : undefined
    const q = arguments.length > 2 ? arguments[2] : undefined
    return model.listResources(owner, tag, q)
  },
  async updateResource(id, patch) {
    return model.updateResource(id, patch)
  },
  async deleteResource(id) {
    return model.deleteResource(id)
  },
  async clearStore() {
    return model.clearStore()
  }
}
