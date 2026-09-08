import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * ScrollToTop component
 * Automatically scrolls window to (0, 0) upon route change (pathname change),
 * while preserving smooth scrolling for section hashes (e.g., #features, #institutes).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If navigating to an on-page anchor/hash, scroll to that section
    if (hash) {
      const targetId = hash.replace('#', '')
      const elem = document.getElementById(targetId)
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' })
        return
      }
      const timer = setTimeout(() => {
        const delayedElem = document.getElementById(targetId)
        if (delayedElem) {
          delayedElem.scrollIntoView({ behavior: 'smooth' })
        }
      }, 50)
      return () => clearTimeout(timer)
    }

    // Otherwise, scroll instantly to top when page path switches
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    })
  }, [pathname, hash])

  return null
}
