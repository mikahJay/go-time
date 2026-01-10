import React, { useState, useEffect, useRef } from 'react'
import { signInWithGoogle, signInWithApple, signInWithFacebook } from '../auth/sso'

export default function Navbar({ user, onSignOut, activeTab, onNavigate }) {
  const [open, setOpen] = useState(false)
  const [signOpen, setSignOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const popRef = useRef(null)
  const profileRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setOpen(false)
    }
    const handleClick = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setSignOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('click', handleClick)
    }
  }, [])

  const handleProvider = async (provider) => {
    let res
    try {
      if (provider === 'google') res = await signInWithGoogle()
      if (provider === 'apple') res = await signInWithApple()
      if (provider === 'facebook') res = await signInWithFacebook()
    } catch (err) {
      console.error(err)
      res = { ok: false, error: err }
    }
    // For now just log the stubbed response; replace with real handling.
    console.log('SSO result', res)
    setSignOpen(false)
  }

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
          <a
            href="#"
            className={`nav-link ${activeTab === 'home' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('home') }}
          >Home</a>
          <a
            href="#"
            className={`nav-link ${activeTab === 'about' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('about') }}
          >About</a>
          <a
            href="#"
            className={`nav-link ${activeTab === 'find' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('find') }}
          >Find Resource</a>
          {user && (
            <a
              href="#"
              className={`nav-link ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('resources') }}
            >My Resources</a>
          )}
          {user ? (
            <div className="nav-link user-info" ref={profileRef}>
              {user.avatar && (
                <img src={user.avatar} alt={user.name} className="user-avatar" onClick={() => setProfileOpen((v) => !v)} />
              )}
              <span className="user-name">{user.name}</span>
              {profileOpen && (
                <div className="profile-popover">
                  <div className="profile-row">
                    {user.avatar && <img src={user.avatar} alt={user.name} className="profile-avatar-large" />}
                    <div>
                      <div className="profile-name">{user.name}</div>
                      {user.email && <div className="profile-email">{user.email}</div>}
                    </div>
                  </div>
                  <div className="profile-actions">
                    <button className="sign-out" onClick={() => { setProfileOpen(false); onSignOut && onSignOut() }}>Sign out</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="nav-link sign-in" ref={popRef}>
              <button className="sign-toggle" onClick={() => setSignOpen((v) => !v)}>Sign in</button>
              {signOpen && (
                <div className="sign-popover">
                  <button className="sign-btn" onClick={() => handleProvider('google')}>Continue with Google</button>
                  <button className="sign-btn" onClick={() => handleProvider('apple')}>Continue with Apple</button>
                  <button className="sign-btn" onClick={() => handleProvider('facebook')}>Continue with Facebook</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
