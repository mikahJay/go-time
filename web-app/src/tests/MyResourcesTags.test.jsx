import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import App from '../App.jsx'

describe('Add Resource with tags', () => {
  const user = { name: 'Tagger', email: 'tagger@example.com' }

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    global.fetch = undefined
  })

  it('allows creating a resource with tags and displays them', async () => {
    localStorage.setItem('goTimeUser', JSON.stringify(user))

    const created = { id: 'res_tag1', name: 'Tagged Resource', description: 'Has tags', quantity: 1, tags: ['alpha', 'beta'] }

    const fetchMock = vi.fn((url, opts) => {
      // initial GET
      if (!opts || !opts.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      // POST create
      if (opts && opts.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(created) })
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    global.fetch = fetchMock

    render(<App />)

    // navigate to My Resources
    const tab = await screen.findByText('My Resources')
    fireEvent.click(tab)

    // open Add panel
    const addLink = await screen.findByText('Add Resource')
    fireEvent.click(addLink)

    const nameInput = screen.getByPlaceholderText('Resource name')
    const descInput = screen.getByPlaceholderText('Short description')
    const qtyInput = screen.getByPlaceholderText('Quantity (default 1)')
    const tagsInput = screen.getByPlaceholderText('Tags (comma-separated)')

    fireEvent.change(nameInput, { target: { value: created.name } })
    fireEvent.change(descInput, { target: { value: created.description } })
    fireEvent.change(qtyInput, { target: { value: String(created.quantity) } })
    fireEvent.change(tagsInput, { target: { value: 'alpha, beta' } })

    const createBtn = screen.getByText('Create')
    fireEvent.click(createBtn)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    // verify resource and tags are displayed
    expect(await screen.findByText(/Tagged Resource/)).toBeInTheDocument()
    expect(screen.getByText(/Has tags/)).toBeInTheDocument()
    expect(screen.getByText(/Tags:/)).toBeInTheDocument()
    expect(screen.getByText(/alpha, beta/)).toBeInTheDocument()
  })
})
