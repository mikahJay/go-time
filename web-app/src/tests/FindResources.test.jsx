import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import App from '../App.jsx'

describe('Find Resources tab', () => {
  const user = { name: 'Searcher', email: 'searcher@example.com' }

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    global.fetch = undefined
  })

  it('shows prompt and requires 3 chars, searches public resources and marks mine', async () => {
    localStorage.setItem('goTimeUser', JSON.stringify(user))

    const results = [
      { id: 'r1', name: 'Public One', description: 'desc1', quantity: 1, public: true },
      { id: 'r2', name: 'Owned', description: 'mine', quantity: 2, public: true, owner: user.email }
    ]

    const fetchMock = vi.fn((url) => {
      // expect search query
      if (String(url).includes('?q=')) return Promise.resolve({ ok: true, json: () => Promise.resolve(results) })
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    global.fetch = fetchMock

    render(<App />)

    const tab = await screen.findByText('Find Resource')
    fireEvent.click(tab)

    // initial prompt
    expect(screen.getByText('Try searching for what you need')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('Search public resources...')
    fireEvent.change(input, { target: { value: 'ab' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => expect(screen.getByText('Please enter at least 3 characters to search')).toBeInTheDocument())

    fireEvent.change(input, { target: { value: 'pub' } })
    fireEvent.click(screen.getByText('Search'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    expect(await screen.findByText(/Public One/)).toBeInTheDocument()
    expect(screen.getByText(/Owned/)).toBeInTheDocument()
    // mine marker
    const ownedLi = screen.getByText(/Owned/).closest('li')
    expect(ownedLi).toHaveTextContent('(Mine)')
  })
})
