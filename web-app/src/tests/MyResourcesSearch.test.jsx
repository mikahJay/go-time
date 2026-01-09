import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import App from '../App.jsx'

describe('My Resources search', () => {
  const user = { name: 'Carol', email: 'carol@example.com' }

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    global.fetch = undefined
  })

  it('filters resources by name and description (case-insensitive, contains)', async () => {
    localStorage.setItem('goTimeUser', JSON.stringify(user))

    const resources = [
      { id: 'r1', name: 'Water', description: 'Fresh spring water', quantity: 10 },
      { id: 'r2', name: 'Food', description: 'Canned beans', quantity: 5 },
      { id: 'r3', name: 'Blankets', description: 'Warm wool blankets', quantity: 3 }
    ]

    // mock fetch for listing resources
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(resources) }))
    global.fetch = fetchMock

    render(<App />)

    // open My Resources tab
    const tab = await screen.findByText('My Resources')
    fireEvent.click(tab)

    // ensure initial items rendered
    expect(await screen.findByText('Water')).toBeInTheDocument()
    expect(screen.getByText('Canned beans')).toBeInTheDocument()

    const searchInput = screen.getByLabelText('Search resources')

    // search by name substring
    fireEvent.change(searchInput, { target: { value: 'wat' } })
    expect(screen.getByText('Water')).toBeInTheDocument()
    expect(screen.queryByText('Food')).not.toBeInTheDocument()

    // search by description substring (case-insensitive)
    fireEvent.change(searchInput, { target: { value: 'WARM' } })
    expect(screen.getByText('Blankets')).toBeInTheDocument()
    expect(screen.queryByText('Water')).not.toBeInTheDocument()

    // search by mid-substring
    fireEvent.change(searchInput, { target: { value: 'anned' } })
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.queryByText('Blankets')).not.toBeInTheDocument()
  })
})
