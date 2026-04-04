import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Word, WordPackageSummary, WordPackageDetail } from '../types'
import { getPackages, getPackage, lookupWord, addWord, addWordCategories } from '../api/client'
import { useTutor } from '../context/TutorContext'
import { useAuth } from '../context/AuthContext'

const isNew = (createdAt: string) =>
  (Date.now() - new Date(createdAt).getTime()) < 15 * 24 * 60 * 60 * 1000

type ItemStatus = 'pending' | 'processing' | 'added' | 'duplicate' | 'error'

interface Item {
  word: string
  status: ItemStatus
  detail?: string
}

interface Props {
  words: Word[]
  onDone: () => void
}

const statusIcon: Record<ItemStatus, string> = {
  pending: '·',
  processing: '…',
  added: '✓',
  duplicate: '–',
  error: '✕',
}

const statusColor: Record<ItemStatus, string> = {
  pending: 'text-gray-400',
  processing: 'text-filos-primary',
  added: 'text-green-600',
  duplicate: 'text-amber-500',
  error: 'text-red-500',
}

export default function PackageWordForm({ words, onDone }: Props) {
  const { tutorId } = useTutor()
  const { user } = useAuth()
  const [packages, setPackages] = useState<WordPackageSummary[]>([])
  const [preview, setPreview] = useState<WordPackageDetail | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getPackages().then(setPackages).catch(() => {})
  }, [])

  // Warn before closing while import is in progress
  useEffect(() => {
    if (!running) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [running])

  const updateItem = (index: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))

  const handleSelectPackage = async (id: string) => {
    const pkg = await getPackage(id)
    setPreview(pkg)
    setItems([])
    setDone(false)
  }

  const handleStartImport = async () => {
    if (!preview) return
    const existingSet = new Set(words.map((w) => w.english.toLowerCase()))
    const initial: Item[] = preview.words.map((word) => ({ word, status: 'pending' }))
    setItems(initial)
    setRunning(true)
    setDone(false)

    for (let i = 0; i < preview.words.length; i++) {
      const word = preview.words[i]
      updateItem(i, { status: 'processing' })

      const packageCats = preview.category ? [preview.category] : []

      if (existingSet.has(word.toLowerCase())) {
        if (packageCats.length > 0) {
          const existing = words.find((w) => w.english.toLowerCase() === word.toLowerCase())
          if (existing) {
            try {
              await addWordCategories(tutorId, existing.id, packageCats)
              updateItem(i, { status: 'duplicate', detail: 'category added' })
            } catch {
              updateItem(i, { status: 'duplicate', detail: 'already in vocabulary' })
            }
          } else {
            updateItem(i, { status: 'duplicate', detail: 'already in vocabulary' })
          }
        } else {
          updateItem(i, { status: 'duplicate', detail: 'already in vocabulary' })
        }
        continue
      }

      try {
        const result = await lookupWord(tutorId, word)
        await addWord(tutorId, {
          word_type: result.word_type,
          english: word,
          target_language: result.target_language,
          notes: result.notes,
          categories: packageCats,
        })
        existingSet.add(word.toLowerCase())
        updateItem(i, { status: 'added', detail: result.target_language })
      } catch (e) {
        const err = e as Error & { existingId?: string }
        if (err.existingId && packageCats.length > 0) {
          try {
            await addWordCategories(tutorId, err.existingId, packageCats)
            updateItem(i, { status: 'duplicate', detail: 'category added' })
          } catch {
            updateItem(i, { status: 'duplicate', detail: 'already in vocabulary' })
          }
        } else if (err.message.includes('already exists')) {
          updateItem(i, { status: 'duplicate', detail: 'already in vocabulary' })
        } else {
          updateItem(i, { status: 'error', detail: 'lookup or add failed' })
        }
      }
    }

    setRunning(false)
    setDone(true)
    onDone()
  }

  const handleReset = () => {
    setPreview(null)
    setItems([])
    setDone(false)
  }

  // ── Package browser ──────────────────────────────────────────
  if (!preview) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-filos-primary font-headline">Add Word Package</h2>
          <Link to="/packages" className="text-sm text-filos-primary hover:underline font-medium">
            Manage packages →
          </Link>
        </div>
        <p className="text-sm text-gray-400 mb-5">Select a package to preview its words before importing.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {packages.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => handleSelectPackage(pkg.id)}
              className="text-left p-4 rounded-xl border-2 border-gray-100 hover:border-filos-primary/40 hover:bg-filos-surface transition group"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-semibold text-gray-800 group-hover:text-filos-primary transition">{pkg.name}</p>
                <div className="flex gap-1 flex-shrink-0">
                  {isNew(pkg.created_at) && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-semibold tracking-wide">✨ New</span>
                  )}
                  {pkg.user_id === user?.id && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-filos-primary/10 text-filos-primary font-medium">Yours</span>
                  )}
                  {!pkg.is_public && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 font-medium">Private</span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-3 leading-snug">{pkg.description}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-filos-primary/10 text-filos-primary">
                  {pkg.word_count} words
                </span>
                {pkg.category && (
                  <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    {pkg.category}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Preview / import ─────────────────────────────────────────
  const importing = items.length > 0

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-filos-primary font-headline">{preview.name}</h2>
        {!running && (
          <button onClick={handleReset} className="text-sm text-gray-400 hover:text-filos-primary font-medium transition">
            ← Back
          </button>
        )}
      </div>
      <p className="text-sm text-gray-400 mb-2">{preview.description}</p>
      {preview.category && (
        <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 mb-4">
          Category: {preview.category}
        </span>
      )}

      {/* Word list preview (before import starts) */}
      {!importing && (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            {preview.words.map((w) => (
              <span
                key={w}
                className={`text-xs px-2.5 py-1 rounded-full border ${
                  words.some((v) => v.english.toLowerCase() === w.toLowerCase())
                    ? 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                    : 'bg-filos-marble border-filos-primary/20 text-gray-700'
                }`}
              >
                {w}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleStartImport}
              className="bg-filos-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-filos-primary-dark transition shadow-sm"
            >
              Load {preview.words.filter((w) => !words.some((v) => v.english.toLowerCase() === w.toLowerCase())).length} words →
            </button>
            {preview.words.some((w) => words.some((v) => v.english.toLowerCase() === w.toLowerCase())) && (
              <p className="text-xs text-gray-400">
                {preview.words.filter((w) => words.some((v) => v.english.toLowerCase() === w.toLowerCase())).length} already in your vocabulary (shown strikethrough)
              </p>
            )}
          </div>
        </>
      )}

      {/* Import progress */}
      {importing && (
        <>
          {running && (
            <div className="flex items-center gap-2 mb-3 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-xs font-medium text-amber-700">
                Import in progress — please do not close or refresh this page until it finishes.
              </p>
            </div>
          )}

          <div className="border border-gray-100 rounded-lg overflow-hidden mb-4">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`font-bold text-sm w-4 text-center ${statusColor[item.status]}`}>
                    {statusIcon[item.status]}
                  </span>
                  <span className={`text-sm font-medium ${item.status === 'processing' ? 'text-filos-primary' : 'text-gray-700'}`}>
                    {item.word}
                  </span>
                </div>
                {item.detail && (
                  <span className={`text-xs ${statusColor[item.status]}`}>{item.detail}</span>
                )}
              </div>
            ))}
          </div>

          {done && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                <span className="text-green-600 font-semibold">{items.filter((i) => i.status === 'added').length} added</span>
                {items.filter((i) => i.status === 'duplicate').length > 0 && (
                  <span className="text-amber-500 font-semibold"> · {items.filter((i) => i.status === 'duplicate').length} skipped</span>
                )}
                {items.filter((i) => i.status === 'error').length > 0 && (
                  <span className="text-red-500 font-semibold"> · {items.filter((i) => i.status === 'error').length} failed</span>
                )}
              </p>
              <button onClick={handleReset} className="text-sm text-filos-primary font-medium hover:underline">
                ← Back to packages
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
