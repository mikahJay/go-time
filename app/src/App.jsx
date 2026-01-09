import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'

function safeAtob(str) {
  if (typeof atob === 'function') return atob(str)
  try {
    return Buffer.from(str, 'base64').toString('binary')
  } catch (e) {
    return null
  }
}

function parseJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const payload = parts[1]
    // fix base64url -> base64
    const b64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const json = safeAtob(b64)
    if (!json) return null
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch (err) {
    return null
  }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [resources, setResources] = useState([])
  const [resourcesErr, setResourcesErr] = useState(null)

  // load persisted user on start
  useEffect(() => {
    try {
      const stored = localStorage.getItem('goTimeUser')
      if (stored) setUser(JSON.parse(stored))
    } catch (e) {
      // ignore
    }
  }, [])

  // persist user changes
  useEffect(() => {
    try {
      if (user) localStorage.setItem('goTimeUser', JSON.stringify(user))
      else localStorage.removeItem('goTimeUser')
    } catch (e) {
      // ignore
    }
  }, [user])

  useEffect(() => {
    try {
      const search = window.location.search
      if (!search) return
      const params = new URLSearchParams(search)
      const provider = params.get('provider')
      const token = params.get('token')
      if (provider && token) {
        // Prefer asking the auth-server for userinfo (server-side). If that fails, fall back
        // to attempting to decode a JWT-style id_token on the client.
        const authServer = import.meta.env.VITE_AUTH_SERVER_BASE || 'http://localhost:3000'
        ;(async () => {
          try {
            const resp = await fetch(`${authServer.replace(/\/$/, '')}/auth/userinfo`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ provider, token })
            })
            if (resp.ok) {
              const data = await resp.json()
              const avatar = data?.picture || data?.raw?.picture || null
              const email = data?.raw?.email || data?.email || null
              if (data?.name) setUser({ name: data.name, avatar, email })
              else {
                const payload = parseJwtPayload(token)
                const name = payload?.name || payload?.given_name || payload?.email || provider
                const picture = payload?.picture || avatar
                const mail = payload?.email || email
                setUser({ name, avatar: picture, email: mail })
              }
            } else {
              const payload = parseJwtPayload(token)
              const name = payload?.name || payload?.given_name || payload?.email || provider
              const picture = payload?.picture || null
              const mail = payload?.email || null
              setUser({ name, avatar: picture, email: mail })
            }
          } catch (err) {
            const payload = parseJwtPayload(token)
            const name = payload?.name || payload?.given_name || payload?.email || provider
            const picture = payload?.picture || null
            const mail = payload?.email || null
            setUser({ name, avatar: picture, email: mail })
          } finally {
            // Clean query params from the URL to avoid leaking tokens
            const newUrl = window.location.origin + window.location.pathname
            window.history.replaceState({}, document.title, newUrl)
          }
        })()
      }
    } catch (err) {
      // ignore parse errors
      // console.error(err)
    }
  }, [])

  // Load resources (public) so the UI can show available resources
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const base = import.meta.env.VITE_RESOURCE_SERVER_BASE || ''
        const url = base ? `${base.replace(/\/$/, '')}/resources` : '/api/resources'
        const resp = await fetch(url)
        if (!mounted) return
        if (!resp.ok) {
          setResourcesErr(`status:${resp.status}`)
          return
        }
        const data = await resp.json()
        setResources(Array.isArray(data) ? data : [])
      } catch (err) {
        if (!mounted) return
        setResourcesErr(err.message || String(err))
      }
    })()
    return () => { mounted = false }
  }, [])

  const handleSignOut = () => {
    setUser(null)
    try { localStorage.removeItem('goTimeUser') } catch (e) {}
  }

  return (
    <div className="app">
      <Navbar user={user} onSignOut={handleSignOut} />
      <main className="app-content">
        {user ? (
          <>
            <h1>Hello {user.name}</h1>
            {resources.length > 0 ? (
              <section>
                <h2>Resources</h2>
                <ul>
                  {resources.map((r) => (
                    <li key={r.id}>{r.name || r.id} — {r.quantity ?? 0}</li>
                  ))}
                </ul>
              </section>
            ) : resourcesErr ? (
              <div>Unable to load resources: {resourcesErr}</div>
            ) : (
              <div>No resources found.</div>
            )}
          </>
        ) : (
          <h1>Make use of resources for worthy causes.</h1>
        )}
      </main>
    </div>
  )
}
