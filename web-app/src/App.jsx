import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import MyResources from './components/MyResources'
import FindResources from './components/FindResources'

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
  
  const [activeTab, setActiveTab] = useState('home')

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

  

  const handleSignOut = () => {
    setUser(null)
    try { localStorage.removeItem('goTimeUser') } catch (e) {}
  }

  return (
    <div className="app">
      <Navbar user={user} onSignOut={handleSignOut} activeTab={activeTab} onNavigate={(t) => setActiveTab(t)} />
      <main className="app-content">
        {activeTab === 'resources' ? (
          <MyResources user={user} />
        ) : activeTab === 'find' ? (
          <FindResources user={user} />
        ) : activeTab === 'about' ? (
          <>
            <h1>About GoTime</h1>
            <p>Make use of resources for worthy causes.</p>
          </>
        ) : (
          // home
          user ? (
            <>
              <h1>Hello {user.name}</h1>
              <div>Use the My Resources tab to view your resources.</div>
            </>
          ) : (
            <h1>Make use of resources for worthy causes.</h1>
          )
        )}
      </main>
    </div>
  )
}
