import request from 'supertest'
import { describe, it, expect, beforeEach } from 'vitest'

// Force in-memory store for tests to avoid hitting real DynamoDB
process.env.RESOURCE_STORE = 'memory'
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

  it('lists resources by owner and by owner+tag (0,1,multiple tags)', async () => {
    // prepare resources
    const owner = 'owner1@example.com'

    const noTags = { name: 'NoTag', quantity: 1, owner }
    const oneTag = { name: 'OneTag', quantity: 2, owner, tags: ['water'] }
    const multiTags = { name: 'MultiTag', quantity: 3, owner, tags: ['food', 'canned'] }

    const r1 = await request(app).post('/resources').send(noTags)
    expect(r1.status).toBe(201)
    const r2 = await request(app).post('/resources').send(oneTag)
    expect(r2.status).toBe(201)
    const r3 = await request(app).post('/resources').send(multiTags)
    expect(r3.status).toBe(201)

    // list by owner only -> all three
    const listAll = await request(app).get('/resources').query({ owner })
    expect(listAll.status).toBe(200)
    expect(Array.isArray(listAll.body)).toBe(true)
    const namesAll = listAll.body.map(i => i.name)
    expect(namesAll).toEqual(expect.arrayContaining(['NoTag','OneTag','MultiTag']))

    // owner + tag 'water' -> only OneTag
    const listWater = await request(app).get('/resources').query({ owner, tag: 'water' })
    expect(listWater.status).toBe(200)
    expect(listWater.body.length).toBe(1)
    expect(listWater.body[0].name).toBe('OneTag')

    // owner + tag 'food' -> MultiTag
    const listFood = await request(app).get('/resources').query({ owner, tag: 'food' })
    expect(listFood.status).toBe(200)
    expect(listFood.body.length).toBe(1)
    expect(listFood.body[0].name).toBe('MultiTag')

    // case-insensitive tag query
    const listFoodUpper = await request(app).get('/resources').query({ owner, tag: 'FOOD' })
    expect(listFoodUpper.status).toBe(200)
    expect(listFoodUpper.body.length).toBe(1)
    expect(listFoodUpper.body[0].name).toBe('MultiTag')

    // tag not present -> empty
    const listMissing = await request(app).get('/resources').query({ owner, tag: 'xyz' })
    expect(listMissing.status).toBe(200)
    expect(Array.isArray(listMissing.body)).toBe(true)
    expect(listMissing.body.length).toBe(0)
  })
})
