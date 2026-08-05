import { useEffect, useRef, useState } from 'react'

type RevealOptions = {
  threshold?: number
  rootMargin?: string
  once?: boolean
}

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {},
) {
  const { threshold = 0.18, rootMargin = '0px 0px -8% 0px', once = true } =
    options
  const ref = useRef<T | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReduced) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setVisible(true)
        if (once) observer.unobserve(entry.target)
      },
      { threshold, rootMargin },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [once, rootMargin, threshold])

  return { ref, visible, className: visible ? 'is-visible' : '' }
}
