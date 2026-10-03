import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    {/* Vercel Web Analytics — counts visitors and page views (see the Analytics tab on Vercel). */}
    <Analytics />
  </React.StrictMode>,
)
