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
  car: 'M5 17a2 2 0 1 0 4 0m6 0a2 2 0 1 0 4 0M5 17H3v-4l2-5h3l2-2h4l2 2h3l2 5v4h-2M7 9l1.5 4h7L17 9',
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
