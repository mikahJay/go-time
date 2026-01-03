import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  test('renders app heading', () => {
    render(<App />)
    expect(screen.getByText(/Make use of resources for worthy causes\./i)).toBeInTheDocument()
  })

  test('renders Navbar with links', () => {
    render(<App />)
    expect(screen.getByText(/GoTime/)).toBeInTheDocument()
    expect(screen.getByText(/Home/)).toBeInTheDocument()
    expect(screen.getByText(/About/)).toBeInTheDocument()
  })

  test('sign in popover opens when clicking Sign in', () => {
    render(<App />)
    const signToggle = screen.getByText(/Sign in/i)
    fireEvent.click(signToggle)
    expect(screen.getByText(/Continue with Google/)).toBeInTheDocument()
    expect(screen.getByText(/Continue with Apple/)).toBeInTheDocument()
    expect(screen.getByText(/Continue with Facebook/)).toBeInTheDocument()
  })
})
