const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { URLSearchParams } = require('url')

dotenv.config()

const PORT = process.env.PORT || 3000
const SERVER_BASE = process.env.SERVER_BASE_URL || `http://localhost:${PORT}`
const CLIENT_REDIRECT = process.env.CLIENT_REDIRECT_URI || 'http://localhost:5173/auth/callback'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ ok: true }))

// Redirect helper: build provider auth URL and redirect the user to provider login
app.get('/auth/:provider', (req, res) => {
  const provider = req.params.provider
  if (provider === 'google') {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: `${SERVER_BASE}/auth/google/callback`,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    })
    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
  }

  if (provider === 'facebook') {
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID || '',
      redirect_uri: `${SERVER_BASE}/auth/facebook/callback`,
      response_type: 'code',
      scope: 'email,public_profile'
    })
    return res.redirect(`https://www.facebook.com/v16.0/dialog/oauth?${params.toString()}`)
  }

  return res.status(400).json({ error: 'unsupported_provider' })
})

// Callback handler: exchange code for tokens, then redirect to client with a token param (stub-safe)
app.get('/auth/:provider/callback', async (req, res) => {
  const provider = req.params.provider
  const code = req.query.code
  if (!code) return res.status(400).json({ error: 'missing_code' })

  try {
    if (provider === 'google') {
      const tokenUrl = 'https://oauth2.googleapis.com/token'
      const params = new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirect_uri: `${SERVER_BASE}/auth/google/callback`,
        grant_type: 'authorization_code'
      })

      const resp = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      })
      const data = await resp.json()
      // Redirect back to client app with id_token (if present) or access_token as a query param
      const token = data.id_token || data.access_token || ''
      const redirectUrl = new URL(CLIENT_REDIRECT)
      redirectUrl.searchParams.set('provider', 'google')
      redirectUrl.searchParams.set('token', token)
      return res.redirect(redirectUrl.toString())
    }

    if (provider === 'facebook') {
      // Facebook token exchange uses a GET request
      const params = new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID || '',
        client_secret: process.env.FACEBOOK_APP_SECRET || '',
        redirect_uri: `${SERVER_BASE}/auth/facebook/callback`,
        code: String(code)
      })
      const resp = await fetch(`https://graph.facebook.com/v16.0/oauth/access_token?${params.toString()}`)
      const data = await resp.json()
      const token = data.access_token || ''
      const redirectUrl = new URL(CLIENT_REDIRECT)
      redirectUrl.searchParams.set('provider', 'facebook')
      redirectUrl.searchParams.set('token', token)
      return res.redirect(redirectUrl.toString())
    }

    // Apple requires a signed JWT from your server; we provide a stubbed response here.
    if (provider === 'apple') {
      // In production you'd validate `code` and call Apple's token endpoint using your private key.
      const redirectUrl = new URL(CLIENT_REDIRECT)
      redirectUrl.searchParams.set('provider', 'apple')
      redirectUrl.searchParams.set('token', 'stub-apple-server-token')
      return res.redirect(redirectUrl.toString())
    }

    return res.status(400).json({ error: 'unsupported_provider' })
  } catch (err) {
    console.error('callback error', err)
    return res.status(500).json({ error: 'server_error', details: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`Auth server listening on ${PORT}`)
  console.log(`Server base URL: ${SERVER_BASE}`)
  console.log(`Client redirect URI: ${CLIENT_REDIRECT}`)
})
