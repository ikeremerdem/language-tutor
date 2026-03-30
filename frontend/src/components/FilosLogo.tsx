export default function FilosLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="rounded-full bg-filos-primary flex items-center justify-center shadow-sm flex-shrink-0"
      style={{ width: size, height: size }}
    >
      <span
        className="text-white font-bold select-none"
        style={{ fontFamily: 'Georgia, serif', fontSize: size * 0.55, lineHeight: 1 }}
      >
        Φ
      </span>
    </div>
  )
}
