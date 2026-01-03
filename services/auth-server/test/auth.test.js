import request from 'supertest'
import { describe, it, expect, afterEach, vi } from 'vitest'

const { default: app } = await import('../server')

describe('auth-server /auth/userinfo', () => {
  afterEach(() => {
    try { vi.restoreAllMocks() } catch (e) {}
    global.fetch = undefined
  })

  it('returns 400 when missing provider or token', async () => {
    const res = await request(app).post('/auth/userinfo').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('missing_provider_or_token')
  })

  it('returns google user info when fetch responds', async () => {
    const fake = { name: 'Test User', email: 'test@example.com', picture: 'http://img.test/avatar.png' }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => fake })

    const res = await request(app).post('/auth/userinfo').send({ provider: 'google', token: 'tok' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('provider', 'google')
    expect(res.body).toHaveProperty('name', 'Test User')
    expect(res.body).toHaveProperty('picture', 'http://img.test/avatar.png')
  })

  it('returns facebook user info and picture when fetch responds', async () => {
    const fbResponse = { name: 'FB User', picture: { data: { url: 'http://fb.test/pic.jpg' } } }
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => fbResponse })

    const res = await request(app).post('/auth/userinfo').send({ provider: 'facebook', token: 'tok' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('provider', 'facebook')
    expect(res.body).toHaveProperty('name', 'FB User')
    expect(res.body).toHaveProperty('picture', 'http://fb.test/pic.jpg')
  })

  it('returns stub for apple', async () => {
    const res = await request(app).post('/auth/userinfo').send({ provider: 'apple', token: 'tok' })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('provider', 'apple')
    expect(res.body).toHaveProperty('name', 'Apple User')
  })
})
