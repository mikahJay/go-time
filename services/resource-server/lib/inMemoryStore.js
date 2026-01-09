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
    // accept optional owner filter
    const owner = arguments.length > 0 ? arguments[0] : undefined
    return model.listResources(owner)
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
