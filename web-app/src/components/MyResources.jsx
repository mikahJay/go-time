import React, { useEffect, useState } from 'react'

export default function MyResources({ user }) {
  const [resources, setResources] = useState([])
  const [resourcesErr, setResourcesErr] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingDesc, setEditingDesc] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newQty, setNewQty] = useState(1)
  const [addingErr, setAddingErr] = useState(null)
  const [search, setSearch] = useState('')

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

  const query = (search || '').toLowerCase().trim()
  const displayedResources = query
    ? resources.filter((r) => JSON.stringify(r).toLowerCase().includes(query))
    : resources

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Your Resources</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            aria-label="Search resources"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '6px 8px' }}
          />
          <a href="#" onClick={(e) => { e.preventDefault(); setShowAdd((s) => !s); setAddingErr(null) }}>
            {showAdd ? 'Close' : 'Add Resource'}
          </a>
        </div>
      </div>
      {showAdd && (
        <section className="add-resource-panel">
          <form onSubmit={async (e) => {
            e.preventDefault()
            setAddingErr(null)
            if (!newName || !newDesc || !newQty) {
              setAddingErr('All fields are required')
              return
            }
            try {
              const base = import.meta.env.VITE_RESOURCE_SERVER_BASE || ''
              const url = base ? `${base.replace(/\/$/, '')}/resources` : `/api/resources`
              const payload = { name: newName, description: newDesc, quantity: Number(newQty), owner: user.email || user.name }
              const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
              if (!resp.ok) {
                const body = await resp.text()
                throw new Error(`status:${resp.status} ${body}`)
              }
              const created = await resp.json()
              setResources((prev) => [created, ...prev])
              setShowAdd(false)
              setNewName('')
              setNewDesc('')
              setNewQty(1)
            } catch (err) {
              setAddingErr(err.message || String(err))
            }
          }}>
            <div>
              <input placeholder="Resource name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <textarea placeholder="Short description" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} />
            </div>
            <div>
              <input type="number" placeholder="Quantity (default 1)" value={newQty} onChange={(e) => setNewQty(e.target.value)} min="1" />
            </div>
            <div>
              <button type="submit">Create</button>
              <button type="button" onClick={() => { setShowAdd(false); setAddingErr(null) }}>Cancel</button>
            </div>
            {addingErr && <div className="error">{addingErr}</div>}
          </form>
        </section>
      )}
      {resources.length > 0 ? (
        <section>
          {displayedResources.length > 0 ? (
            <ul>
              {displayedResources.map((r) => (
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
          ) : (
            <div>No resources match your search criteria.</div>
          )}
        </section>
      ) : resourcesErr ? (
        <div>Unable to load resources: {resourcesErr}</div>
      ) : (
        <div>No resources found. Try adding some.</div>
      )}
    </>
  )
}
