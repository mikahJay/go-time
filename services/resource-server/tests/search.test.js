import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'

// Force in-memory store for tests to avoid hitting real DynamoDB
process.env.RESOURCE_STORE = 'memory'
const { default: app } = await import('../server')
const model = await import('../models/resourceModel')

describe('resource-server search API', () => {
  beforeEach(() => {
    model.clearStore()
  })

  it('returns only public resources for anonymous searches', async () => {
    const publicRes = { name: 'PublicOne', quantity: 1, public: true }
    const privateRes = { name: 'PrivateOne', quantity: 2, public: false }
    const createdPublic = await request(app).post('/resources').send(publicRes)
    expect(createdPublic.status).toBe(201)
    const createdPrivate = await request(app).post('/resources').send(privateRes)
    expect(createdPrivate.status).toBe(201)

    // anonymous search (no owner) should only return public resources
    const list = await request(app).get('/resources').query({ q: 'One' })
    expect(list.status).toBe(200)
    const names = list.body.map(i => i.name)
    expect(names).toContain('PublicOne')
    expect(names).not.toContain('PrivateOne')
  })

  it('returns private resources when owner is specified', async () => {
    const owner = 'owner@example.com'
    const privateOwned = { name: 'OwnedPrivate', quantity: 1, public: false, owner }
    const created = await request(app).post('/resources').send(privateOwned)
    expect(created.status).toBe(201)

    // search with owner param should include private resource
    const list = await request(app).get('/resources').query({ owner, q: 'Owned' })
    expect(list.status).toBe(200)
    expect(list.body.length).toBeGreaterThan(0)
    const names = list.body.map(i => i.name)
    expect(names).toContain('OwnedPrivate')
  })
})
