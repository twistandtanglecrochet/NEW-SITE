import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'

function start() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
      {/* Vercel Web Analytics — counts visitors and page views (see the Analytics tab on Vercel). */}
      <Analytics />
    </React.StrictMode>,
  )
}

// A first-time visitor: wait a moment (at most 1.5 s, usually nothing, the request started when the page began
// loading) for the live settings, so the first screen already has the right settings.
const early = typeof window !== 'undefined' ? window.__ttcEarlyP : null
if (early && typeof early.then === 'function') {
  Promise.race([early, new Promise((r) => setTimeout(r, 1500))]).then(start, start)
} else {
  start()
}
