import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'

const { default: app } = await import('../server')
const model = await import('../models/resourceModel')

describe('resource-server basic API', () => {
  beforeEach(() => {
    model.clearStore()
  })

  it('creates and retrieves a resource', async () => {
    const payload = { name: 'Test', type: 'cpu', quantity: 4 }
    const createRes = await request(app).post('/resources').send(payload)
    expect(createRes.status).toBe(201)
    expect(createRes.body).toHaveProperty('id')

    const id = createRes.body.id
    const getRes = await request(app).get(`/resources/${id}`)
    expect(getRes.status).toBe(200)
    expect(getRes.body.name).toBe('Test')
  })
})
