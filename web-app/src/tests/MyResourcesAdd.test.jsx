import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { vi } from 'vitest'
import App from '../App.jsx'

describe('Add Resource flow', () => {
  const user = { name: 'Bob', email: 'bob@example.com' }

  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    global.fetch = undefined
  })

  it('creates a resource and shows name and description in the list', async () => {
    localStorage.setItem('goTimeUser', JSON.stringify(user))

    const created = { id: 'res_test1', name: 'Test Resource', description: 'Helpful widget', quantity: 2 }

    const fetchMock = vi.fn((url, opts) => {
      // initial list (GET)
      if (!opts || !opts.method) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
      }
      // create (POST)
      if (opts && opts.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(created) })
      }
      // fallback
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    })
    global.fetch = fetchMock

    render(<App />)

    // navigate to My Resources tab
    const tab = await screen.findByText('My Resources')
    fireEvent.click(tab)

    // open Add Resource panel
    const addLink = await screen.findByText('Add Resource')
    fireEvent.click(addLink)

    const nameInput = screen.getByPlaceholderText('Resource name')
    const descInput = screen.getByPlaceholderText('Short description')
    const qtyInput = screen.getByPlaceholderText('Quantity (default 1)')

    fireEvent.change(nameInput, { target: { value: created.name } })
    fireEvent.change(descInput, { target: { value: created.description } })
    fireEvent.change(qtyInput, { target: { value: String(created.quantity) } })

    const createBtn = screen.getByText('Create')
    fireEvent.click(createBtn)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    // verify the created resource appears
    expect(await screen.findByText(/Test Resource/)).toBeInTheDocument()
    expect(screen.getByText(/Helpful widget/)).toBeInTheDocument()
  })
})
