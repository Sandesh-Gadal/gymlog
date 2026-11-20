import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import './index.css'
import { AuthProvider } from './state/AuthContext'
import { applyTheme } from './state/theme'

applyTheme()
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme())

// Ask the browser not to evict our offline data under storage pressure.
navigator.storage?.persist?.().catch(() => {})

// Auto-update the service worker; new versions activate on next load.
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
