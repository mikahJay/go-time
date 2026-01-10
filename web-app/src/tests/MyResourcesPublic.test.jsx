import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import App from '../App.jsx'

describe('Public flag behavior', () => {
  const user = { name: 'Publicy', email: 'publicy@example.com' }

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    global.fetch = undefined
  })

  it('creates a public resource and allows toggling public/private', async () => {
    localStorage.setItem('goTimeUser', JSON.stringify(user))

    const created = { id: 'res_pub1', name: 'Public Resource', description: 'Visible to all', quantity: 1, public: true }
    const updatedPrivate = { ...created, public: false }

    const fetchMock = vi.fn((url, opts) => {
      // initial GET
      if (!opts || !opts.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      // POST create
      if (opts && opts.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(created) })
      }
      // PUT toggle
      if (opts && opts.method === 'PUT') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(updatedPrivate) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    global.fetch = fetchMock

    render(<App />)

    const tab = await screen.findByText('My Resources')
    fireEvent.click(tab)

    const addLink = await screen.findByText('Add Resource')
    fireEvent.click(addLink)

    fireEvent.change(screen.getByPlaceholderText('Resource name'), { target: { value: created.name } })
    fireEvent.change(screen.getByPlaceholderText('Short description'), { target: { value: created.description } })
    fireEvent.change(screen.getByPlaceholderText('Quantity (default 1)'), { target: { value: String(created.quantity) } })
    // check the public checkbox
    const publicCheckbox = screen.getByLabelText(/Make public/i) || screen.getByRole('checkbox')
    fireEvent.click(publicCheckbox)

    fireEvent.click(screen.getByText('Create'))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    // verify it's rendered and name styled green
    const nameEl = await screen.findByText(/Public Resource/)
    const strong = nameEl.closest('li').querySelector('strong')
    // jsdom reports computed rgb color; accept the rgb representation
    expect(strong).toHaveStyle({ color: 'rgb(0, 128, 0)' })

    // click toggle to make private
    const toggle = screen.getByText('Make private')
    fireEvent.click(toggle)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    // after toggle, name should not be green
    const updatedStrong = (await screen.findByText(/Public Resource/)).closest('li').querySelector('strong')
    expect(updatedStrong).not.toHaveStyle({ color: 'green' })
  })
})
