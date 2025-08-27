// Utility functions for cache management

export const clearAllCache = () => {
  try {
    // Clear localStorage
    localStorage.clear()
    console.log('🧹 Cleared localStorage')

    // Clear sessionStorage
    sessionStorage.clear()
    console.log('🧹 Cleared sessionStorage')

    // Clear any cached API responses by forcing browser to reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name)
          console.log(`🧹 Cleared cache: ${name}`)
        })
      })
    }

    console.log('✅ All cache cleared successfully')
  } catch (error) {
    console.error('❌ Error clearing cache:', error)
  }
}

export const getUncachedTimestamp = () => {
  return Date.now()
}

export const addNoCacheHeaders = (headers: HeadersInit = {}): HeadersInit => {
  return {
    ...headers,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  }
}

export const createNoCacheFetch = (url: string, options: RequestInit = {}) => {
  const timestamp = getUncachedTimestamp()
  const separator = url.includes('?') ? '&' : '?'
  const timestampedUrl = `${url}${separator}_t=${timestamp}`
  
  return fetch(timestampedUrl, {
    ...options,
    cache: 'no-store',
    headers: addNoCacheHeaders(options.headers),
  })
}
