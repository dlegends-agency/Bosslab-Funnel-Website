import { useMemo } from 'react'

function generateStars(count: number) {
  const shadows: string[] = []
  for (let i = 0; i < count; i++) {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() * 200).toFixed(2)
    shadows.push(`${x}vw ${y}vh #fff`)
  }
  return shadows.join(', ')
}

export function StarField() {
  const small = useMemo(() => generateStars(200), [])
  const medium = useMemo(() => generateStars(90), [])
  const large = useMemo(() => generateStars(35), [])

  return (
    <div className="starfield" aria-hidden="true">
      <div className="starfield__nebula" />
      <div
        className="starfield__layer starfield__layer--small"
        style={{ boxShadow: small }}
      />
      <div
        className="starfield__layer starfield__layer--medium"
        style={{ boxShadow: medium }}
      />
      <div
        className="starfield__layer starfield__layer--large"
        style={{ boxShadow: large }}
      />
      <span className="starfield__sparkle starfield__sparkle--a" />
      <span className="starfield__sparkle starfield__sparkle--b" />
      <span className="starfield__sparkle starfield__sparkle--c" />
      <span className="starfield__shooting-star starfield__shooting-star--a" />
      <span className="starfield__shooting-star starfield__shooting-star--b" />
    </div>
  )
}
