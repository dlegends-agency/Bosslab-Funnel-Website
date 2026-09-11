import { useMemo } from 'react'

function randomStars(count: number) {
  const stars: string[] = []
  for (let i = 0; i < count; i += 1) {
    const x = (Math.random() * 100).toFixed(2)
    const y = (Math.random() * 196).toFixed(2)
    stars.push(`rgb(255, 255, 255) ${x}vw ${y}vh`)
  }
  return stars.join(', ')
}

export function Starfield() {
  const small = useMemo(() => randomStars(120), [])
  const medium = useMemo(() => randomStars(55), [])
  const large = useMemo(() => randomStars(18), [])

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
      <span className="starfield__sparkle starfield__sparkle--d" />
      <span className="starfield__shooting-star starfield__shooting-star--a" />
      <span className="starfield__shooting-star starfield__shooting-star--b" />
    </div>
  )
}
