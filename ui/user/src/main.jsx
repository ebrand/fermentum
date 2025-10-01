import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Log Stytch configuration for debugging
console.log('VITE_STYTCH_PUBLIC_TOKEN:', import.meta.env.VITE_STYTCH_PUBLIC_TOKEN || 'NOT SET')
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL || 'NOT SET')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)