import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'

process.env.RESOURCE_STORE = 'memory'
const { default: app } = await import('../server')
const model = await import('../models/resourceModel')

describe('resource-server public flag API', () => {
  beforeEach(() => {
    model.clearStore()
  })

  it('creates a resource with public=false by default and allows toggling public', async () => {
    const payload = { name: 'PubTest', quantity: 1 }
    const createRes = await request(app).post('/resources').send(payload)
    expect(createRes.status).toBe(201)
    expect(createRes.body).toHaveProperty('id')
    expect(createRes.body.public).toBe(false)

    const id = createRes.body.id
    // toggle to public
    const putRes = await request(app).put(`/resources/${id}`).send({ public: true })
    expect(putRes.status).toBe(200)
    expect(putRes.body.public).toBe(true)

    // toggle back to private
    const putRes2 = await request(app).put(`/resources/${id}`).send({ public: false })
    expect(putRes2.status).toBe(200)
    expect(putRes2.body.public).toBe(false)
  })
})
