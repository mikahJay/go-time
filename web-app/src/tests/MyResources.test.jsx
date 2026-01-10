import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import App from '../App.jsx'

describe('My Resources tab', () => {
  const user = { name: 'Alice', email: 'alice@example.com' }

  beforeEach(() => {
    // clear mocks and localStorage between tests
    vi.restoreAllMocks()
    localStorage.clear()
    global.fetch = undefined
  })

  it('does not show My Resources when not authenticated', () => {
    localStorage.removeItem('goTimeUser')
    render(<App />)
    const maybe = screen.queryByText('My Resources')
    expect(maybe).not.toBeInTheDocument()
  })

  it('shows My Resources when authenticated', () => {
    localStorage.setItem('goTimeUser', JSON.stringify(user))
    render(<App />)
    const tab = screen.getByText('My Resources')
    expect(tab).toBeInTheDocument()
  })

  it('calls resource-server /resources endpoint with owner filter', async () => {
    localStorage.setItem('goTimeUser', JSON.stringify(user))

    const resources = [{ id: 'r1', name: 'Water', quantity: 5 }]
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(resources) }))
    global.fetch = fetchMock

    render(<App />)

    // click the My Resources tab to ensure UI renders the resources section
    const tab = await screen.findByText('My Resources')
    fireEvent.click(tab)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    // determine expected owner id used by the app
    const expectedId = encodeURIComponent(user.email || user.name)
    // find the call that contains 'resources' and 'owner='
    const calledWith = fetchMock.mock.calls.find(([url]) => String(url).includes('resources') && String(url).includes('owner='))
    expect(calledWith).toBeTruthy()
    const calledUrl = String(calledWith[0])
    expect(calledUrl).toContain(`owner=${expectedId}`)

    // resources should render
    expect(await screen.findByText(/Water/)).toBeInTheDocument()
  })
})
