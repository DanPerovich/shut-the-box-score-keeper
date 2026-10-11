import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Drop cache-bust param left by a manual force refresh.
{
  const url = new URL(window.location.href)
  if (url.searchParams.has('_refresh')) {
    url.searchParams.delete('_refresh')
    window.history.replaceState(null, '', url.pathname + url.search + url.hash)
  }
}

// autoUpdate + periodic checks so iOS home-screen PWAs pick up deploys
// without a hard refresh (which standalone mode does not offer).
registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return
    const check = () => {
      void registration.update()
    }
    check()
    setInterval(check, 15 * 60 * 1000)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check()
    })
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
