type IconProps = {
  className?: string
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 448 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M313.941 216H12c-6.627 0-12 5.373-12 12v56c0 6.627 5.373 12 12 12h301.941v46.059c0 21.382 25.851 32.09 40.971 16.971l86.059-86.059c9.373-9.373 9.373-24.569 0-33.941l-86.059-86.059c-15.119-15.119-40.971-4.411-40.971 16.971V216z"
      />
    </svg>
  )
}

export function CloseCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm121.6 313.1c4.7 4.7 4.7 12.3 0 17L338 377.6c-4.7 4.7-12.3 4.7-17 0L256 312l-65.1 65.6c-4.7 4.7-12.3 4.7-17 0L134.4 338c-4.7-4.7-4.7-12.3 0-17l65.6-65-65.6-65.1c-4.7-4.7-4.7-12.3 0-17l39.6-39.6c4.7-4.7 12.3-4.7 17 0l65 65.7 65.1-65.6c4.7-4.7 12.3-4.7 17 0l39.6 39.6c4.7 4.7 4.7 12.3 0 17L312 256l65.6 65.1z"
      />
    </svg>
  )
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 512 512" aria-hidden="true">
      <path
        fill="currentColor"
        d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"
      />
    </svg>
  )
}

/** Clean 24x24 outline icons for local business categories */
const industryIcons: Record<string, string> = {
  roof: 'M3 12l9-9 9 9M5 10v10a1 1 0 0 0 1 1h3m10-11v10a1 1 0 0 1-1 1h-3m-6 0h6m-6 0v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4',
  wrench:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  bolt: 'M13 2L4.5 13.5H12l-1 8.5L19.5 10.5H12L13 2z',
  tooth:
    'M8 3c-1.5 0-3 1.2-3 3.2 0 1.4.5 2.4 1 3.5.6 1.3 1.2 2.7 1.2 4.8 0 2.2 1.1 4.5 2.8 4.5s2.2-1.5 2.2-3.2c0 1.7.5 3.2 2.2 3.2s2.8-2.3 2.8-4.5c0-2.1.6-3.5 1.2-4.8.5-1.1 1-2.1 1-3.5C19 4.2 17.5 3 16 3c-1.3 0-2.3.7-3.2 1.4C11.9 3.7 10.9 3 9.6 3 9 3 8.5 3 8 3z',
  fan: 'M12 12c0-3 2-5.5 2-8a2 2 0 1 0-4 0c0 2.5 2 5 2 8zm0 0c3 0 5.5 2 8 2a2 2 0 1 0 0-4c-2.5 0-5 2-8 2zm0 0c0 3-2 5.5-2 8a2 2 0 1 0 4 0c0-2.5-2-5-2-8zm0 0c-3 0-5.5-2-8-2a2 2 0 1 0 0 4c2.5 0 5-2 8-2z',
  car: 'M19 17h2a1 1 0 0 0 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4a1 1 0 0 0 1 1h2M7 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0zM17 17a2 2 0 1 0 4 0 2 2 0 1 0-4 0z',
  leaf: 'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  sparkle:
    'M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3zm7 11l.8 2.7L22.5 18l-2.7.8L19 21.5l-.8-2.7L15.5 18l2.7-.8L19 14z',
  building:
    'M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M10 9h.01M10 13h.01M10 17h.01M16 21V11h3a1 1 0 0 1 1 1v9M4 21h16',
  calculator:
    'M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm2 4h8M8 12h2m2 0h2m2 0h2M8 16h2m2 0h2m2 0h2',
  scissors:
    'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12',
  bug: 'M8 6.5A3.5 3.5 0 0 1 12 3a3.5 3.5 0 0 1 4 3.5V8H8V6.5zM8 8v8a4 4 0 0 0 8 0V8M3 13h4m10 0h4M5 8l3 2m8-2l3-2M5 18l3-2m8 2l3-2',
  medical:
    'M2 12a10 10 0 1 0 20 0 10 10 0 1 0-20 0zM12 7v10M7 12h10',
  comb: 'M4 4h16M4 4v16M8 4v6M12 4v6M16 4v6M20 4v6',
  droplet: 'M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z',
  hardhat:
    'M4 18h16M6 18v-3a6 6 0 0 1 12 0v3M9 10V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4M3 18h18',
  gavel:
    'M14 5l5 5M9 10l-6 6 3 3 6-6M13 6l5 5M17 12l4 4-2 2-4-4M3 21h7',
  utensils:
    'M6 2v7a2 2 0 0 0 4 0V2M8 9v13M18 2c-2 2-2 5-2 8s0 4 2 4 2-1 2-4 0-6-2-8zM18 14v9',
  house:
    'M3 11l9-8 9 8M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10',
  briefcase:
    'M4 8h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M4 13h16',
}

export function PhoneIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  )
}

export function TrendingUpIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 6l-9.5 9.5-5-5L1 18" />
      <path d="M17 6h6v6" />
    </svg>
  )
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

export function RocketIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  )
}

export function MailIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  )
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.59 13.41L13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <path d="M6.75 7a.25.25 0 1 0 .5 0 .25.25 0 1 0-.5 0" />
    </svg>
  )
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  )
}

export function StoreIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 9l1-6h16l1 6" />
      <path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
      <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
      <path d="M9 21v-6h6v6" />
    </svg>
  )
}

export function LockIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

export function CrownIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 20h16M4 20l-1.5-11L7 13l5-8 5 8 4.5-4L20 20" />
    </svg>
  )
}

export function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6l-4 4H4a1 1 0 0 0-1 1z" />
      <path d="M16 8a4 4 0 0 1 0 8" />
      <path d="M19 5a8 8 0 0 1 0 14" />
    </svg>
  )
}

export function CreditCardIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20M6 15h4" />
    </svg>
  )
}

export function IndustryIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const path = industryIcons[name] ?? industryIcons.building

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}
