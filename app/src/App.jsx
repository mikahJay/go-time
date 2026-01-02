import React from 'react'
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className="app">
      <Navbar />
      <main className="app-content">
        <h1>Hello, world!</h1>
        <p>This is a simple React app.</p>
      </main>
    </div>
  )
}
