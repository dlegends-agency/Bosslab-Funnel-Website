import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../lib/tracking'

/** Boots FB / GA / Google Ads and fires page views on route changes. */
export function TrackingPixels() {
  const location = useLocation()

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) return
    void trackPageView(location.pathname + location.search)
  }, [location.pathname, location.search])

  return null
}
