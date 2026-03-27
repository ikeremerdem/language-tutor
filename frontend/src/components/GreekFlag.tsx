export default function GreekFlag({ className = 'w-8 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 27 18" className={className} aria-label="Greek flag">
      <rect width="27" height="18" fill="#0D5EAF" />
      <rect y="2" width="27" height="2" fill="#FFF" />
      <rect y="6" width="27" height="2" fill="#FFF" />
      <rect y="10" width="27" height="2" fill="#FFF" />
      <rect y="14" width="27" height="2" fill="#FFF" />
      <rect width="10" height="10" fill="#0D5EAF" />
      <rect x="4" width="2" height="10" fill="#FFF" />
      <rect y="4" width="10" height="2" fill="#FFF" />
    </svg>
  )
}
