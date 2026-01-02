import React, { useState, useEffect } from 'react'

export default function Navbar() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">GoTime</div>

        <button
          className="nav-toggle"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`hamburger ${open ? 'open' : ''}`} />
        </button>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          <a href="#" className="nav-link">Home</a>
          <a href="#" className="nav-link">About</a>
          <a href="#" className="nav-link sign-in">Sign in</a>
        </div>
      </div>
    </nav>
  )
}
