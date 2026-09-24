type LightbulbOffIconProps = {
  className?: string
}

export function LightbulbOffIcon({
  className = 'buttonIcon',
}: LightbulbOffIconProps) {
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
      focusable="false"
    >
      <path d="M16.8 11.2c.8-.9 1.2-2 1.2-3.2a6 6 0 0 0-9.3-5" />
      <path d="m2 2 20 20" />
      <path d="M6.3 6.3a6 6 0 0 0 .9 7.4c1 .9 1.5 2.2 1.5 3.3" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  )
}
