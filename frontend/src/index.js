import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './app/App'

function disableZoom() {
  const prevent = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      return false
    }
  }

  document.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
    }
  }, { passive: false })

  document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    if ((e.ctrlKey || e.metaKey) && ['=', '+', '-', '0'].includes(key)) {
      e.preventDefault()
    }
  })

  document.addEventListener('gesturestart', (e) => {
    e.preventDefault()
  })
  document.addEventListener('gesturechange', (e) => {
    e.preventDefault()
  })
  document.addEventListener('gestureend', (e) => {
    e.preventDefault()
  })

  document.addEventListener('touchmove', (e) => {
    if (e.ctrlKey || e.scale !== 1) {
      e.preventDefault()
    }
  }, { passive: false })
}

disableZoom()

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
