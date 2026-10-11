/**
 * Hard refresh for iOS home-screen PWAs: unregister the service worker,
 * wipe Cache Storage, then reload with a cache-busting query param.
 * localStorage (game state) is left intact.
 */
export async function forceRefreshApp(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations()
      await Promise.all(registrations.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }
  } catch {
    // Still reload even if cleanup partially fails.
  }

  const url = new URL(window.location.href)
  url.searchParams.set('_refresh', String(Date.now()))
  window.location.replace(url.toString())
}
