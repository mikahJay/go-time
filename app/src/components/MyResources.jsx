import React, { useEffect, useState } from 'react'

export default function MyResources({ user }) {
  const [resources, setResources] = useState([])
  const [resourcesErr, setResourcesErr] = useState(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!user) return
      try {
        const id = user.email || user.name
        const base = import.meta.env.VITE_RESOURCE_SERVER_BASE || ''
        const url = base
          ? `${base.replace(/\/$/, '')}/resources?owner=${encodeURIComponent(id)}`
          : `/api/resources?owner=${encodeURIComponent(id)}`
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
  }, [user])

  if (!user) return <div>Please sign in to view your resources.</div>

  return (
    <>
      <h1>Your Resources</h1>
      {resources.length > 0 ? (
        <section>
          <ul>
            {resources.map((r) => (
              <li key={r.id}>{r.name || r.id} — {r.quantity ?? 0}</li>
            ))}
          </ul>
        </section>
      ) : resourcesErr ? (
        <div>Unable to load resources: {resourcesErr}</div>
      ) : (
        <div>No resources found. Try adding some.</div>
      )}
    </>
  )
}
