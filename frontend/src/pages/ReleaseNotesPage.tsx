import { useEffect, useState } from 'react'

function parseMarkdown(md: string): React.ReactNode[] {
  const lines = md.split('\n')
  const nodes: React.ReactNode[] = []
  let bulletBuffer: string[] = []

  const flushBullets = (key: string) => {
    if (bulletBuffer.length === 0) return
    nodes.push(
      <ul key={key} className="space-y-1.5 mb-4 ml-1">
        {bulletBuffer.map((text, i) => (
          <li key={i} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
            <span className="text-filos-primary mt-0.5 flex-shrink-0">•</span>
            <span>{parseBold(text)}</span>
          </li>
        ))}
      </ul>
    )
    bulletBuffer = []
  }

  lines.forEach((line, i) => {
    if (line.startsWith('### ')) {
      flushBullets(`ul-${i}`)
      nodes.push(
        <h3 key={i} className="text-base font-semibold text-filos-primary mt-6 mb-2 font-headline">
          {line.slice(4)}
        </h3>
      )
    } else if (line.startsWith('# ')) {
      flushBullets(`ul-${i}`)
      // skip the top-level heading — page title handles it
    } else if (line.startsWith('- ')) {
      bulletBuffer.push(line.slice(2))
    } else {
      flushBullets(`ul-${i}`)
    }
  })
  flushBullets('ul-end')
  return nodes
}

function parseBold(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-800">{part.slice(2, -2)}</strong>
      : part
  )
}

export default function ReleaseNotesPage() {
  const [content, setContent] = useState<string | null>(null)

  useEffect(() => {
    fetch('/release_notes.md')
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setContent('Could not load release notes.'))
  }, [])

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-filos-primary font-headline mb-1">Release Notes</h1>
      <p className="text-sm text-gray-400 mb-6">What's new in Filos</p>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {content === null ? (
          <p className="text-gray-400 text-sm">Loading…</p>
        ) : (
          parseMarkdown(content)
        )}
      </div>
    </div>
  )
}
