import React, { useState } from 'react'

export default function FindResources({ user }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  const doSearch = async (q) => {
    setErr(null)
    setLoading(true)
    try {
      const base = import.meta.env.VITE_RESOURCE_SERVER_BASE || ''
      const url = base ? `${base.replace(/\/$/, '')}/resources?q=${encodeURIComponent(q)}` : `/api/resources?q=${encodeURIComponent(q)}`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`status:${resp.status}`)
      const data = await resp.json()
      setResults(Array.isArray(data) ? data : [])
    } catch (e) {
      setErr(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e) => {
    e && e.preventDefault()
    const q = (query || '').trim()
    if (q.length < 3) {
      setErr('Please enter at least 3 characters to search')
      setResults(null)
      return
    }
    doSearch(q)
  }

  return (
    <div>
      <h1>Find Resources</h1>
      <form onSubmit={onSubmit} style={{ marginBottom: '1rem' }}>
        <input
          aria-label="Find resources"
          placeholder="Search public resources..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setErr(null) }}
          style={{ padding: '6px 8px', width: '60%' }}
        />
        <button onClick={onSubmit} style={{ marginLeft: '0.5rem' }}>Search</button>
      </form>

      {!results && !err && !loading && (
        <div>Try searching for what you need</div>
      )}

      {err && <div className="error">{err}</div>}
      {loading && <div>Searching...</div>}

      {results && results.length > 0 && (
        <section>
          <ul>
            {results.map((r) => (
              <li key={r.id}>
                <div>
                  <strong>{r.name || r.id}</strong>
                  {user && r.owner && (user.email === r.owner || user.name === r.owner) && (
                    <span style={{ color: '#888', marginLeft: '0.5rem' }}>(Mine)</span>
                  )}
                  {' '}— {r.quantity ?? 0}
                </div>
                <div>{r.description || <em>No description</em>}</div>
                {r.tags && r.tags.length > 0 && (
                  <div>Tags: {r.tags.join(', ')}</div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {results && results.length === 0 && (
        <div>No public resources found matching your query.</div>
      )}
    </div>
  )
}
