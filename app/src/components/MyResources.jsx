import React, { useEffect, useState } from 'react'

export default function MyResources({ user }) {
  const [resources, setResources] = useState([])
  const [resourcesErr, setResourcesErr] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingDesc, setEditingDesc] = useState('')

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
              <li key={r.id}>
                <div><strong>{r.name || r.id}</strong> — {r.quantity ?? 0}</div>
                <div>{r.description || <em>No description</em>}</div>
                {editingId === r.id ? (
                  <div>
                    <textarea value={editingDesc} onChange={(e) => setEditingDesc(e.target.value)} rows={3} cols={40} />
                    <div>
                      <button onClick={async () => {
                        try {
                          const base = import.meta.env.VITE_RESOURCE_SERVER_BASE || ''
                          const url = base ? `${base.replace(/\/$/, '')}/resources/${r.id}` : `/api/resources/${r.id}`
                          const resp = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: editingDesc }) })
                          if (!resp.ok) throw new Error(`status:${resp.status}`)
                          const updated = await resp.json()
                          setResources((prev) => prev.map((it) => it.id === updated.id ? updated : it))
                        } catch (err) {
                          // show error inline
                          setResourcesErr(err.message || String(err))
                        } finally {
                          setEditingId(null)
                          setEditingDesc('')
                        }
                      }}>Save</button>
                      <button onClick={() => { setEditingId(null); setEditingDesc('') }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button onClick={() => { setEditingId(r.id); setEditingDesc(r.description || '') }}>Edit description</button>
                  </div>
                )}
              </li>
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
