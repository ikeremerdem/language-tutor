import { useEffect, useMemo, useRef, useState } from 'react'
import { useTutor } from '../context/TutorContext'
import {
  getReadingTexts,
  createReadingText,
  getReadingText,
  deleteReadingText,
  getWordInfo,
} from '../api/client'
import type { WordInfo, ReadingText, ReadingTextSummary } from '../types'

type Source = 'target' | 'english'

interface Token {
  text: string
  isWord: boolean
}

// Split text into word / non-word tokens, preserving everything (incl. line breaks).
function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  const re = /\p{L}[\p{L}\p{M}'’-]*/gu
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ text: text.slice(last, m.index), isWord: false })
    tokens.push({ text: m[0], isWord: true })
    last = m.index + m[0].length
  }
  if (last < text.length) tokens.push({ text: text.slice(last), isWord: false })
  return tokens
}

// The sentence/context a word belongs to, for better LLM disambiguation.
function sentenceAround(text: string, index: number): string {
  const start = Math.max(
    text.lastIndexOf('.', index - 1),
    text.lastIndexOf('\n', index - 1),
    text.lastIndexOf('!', index - 1),
    text.lastIndexOf('?', index - 1),
  )
  let end = text.length
  for (const ch of ['.', '\n', '!', '?']) {
    const i = text.indexOf(ch, index)
    if (i !== -1 && i < end) end = i + 1
  }
  return text.slice(start + 1, end).trim()
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ReadingPage() {
  const { tutorId, targetLanguage } = useTutor()

  // List of saved reading texts
  const [items, setItems] = useState<ReadingTextSummary[]>([])
  const [listLoading, setListLoading] = useState(true)

  // New-text form
  const [title, setTitle] = useState('')
  const [source, setSource] = useState<Source>('target')
  const [input, setInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Active (opened) reading text
  const [active, setActive] = useState<ReadingText | null>(null)
  const [opening, setOpening] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)

  // Word info panel
  const [selected, setSelected] = useState<{ word: string; key: string } | null>(null)
  const [info, setInfo] = useState<WordInfo | null>(null)
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoError, setInfoError] = useState<string | null>(null)
  const cache = useRef<Map<string, WordInfo>>(new Map())

  const tokens = useMemo(() => (active ? tokenize(active.target_text) : []), [active])

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorId])

  async function loadList() {
    setListLoading(true)
    try {
      setItems(await getReadingTexts(tutorId))
    } catch {
      /* ignore */
    } finally {
      setListLoading(false)
    }
  }

  async function handleCreate() {
    if (!input.trim()) return
    setSaving(true)
    setError(null)
    try {
      const created = await createReadingText(tutorId, title, input, source)
      setTitle('')
      setInput('')
      openText(created)
      loadList()
    } catch (e) {
      setError((e as Error).message || 'Failed to save text')
    } finally {
      setSaving(false)
    }
  }

  function openText(t: ReadingText) {
    resetWordPanel()
    setShowTranslation(false)
    setActive(t)
  }

  async function handleOpenById(id: string) {
    setOpening(true)
    try {
      openText(await getReadingText(tutorId, id))
    } catch (e) {
      setError((e as Error).message || 'Failed to open text')
    } finally {
      setOpening(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reading text?')) return
    await deleteReadingText(tutorId, id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function resetWordPanel() {
    setSelected(null)
    setInfo(null)
    setInfoError(null)
    cache.current.clear()
  }

  function backToList() {
    setActive(null)
    resetWordPanel()
  }

  async function selectWord(word: string, charIndex: number) {
    if (!active) return
    const key = word.toLocaleLowerCase()
    setSelected({ word, key })
    setInfoError(null)
    const cached = cache.current.get(key)
    if (cached) {
      setInfo(cached)
      setInfoLoading(false)
      return
    }
    setInfo(null)
    setInfoLoading(true)
    try {
      const context = sentenceAround(active.target_text, charIndex)
      const res = await getWordInfo(tutorId, word, context)
      cache.current.set(key, res)
      setInfo(res)
    } catch (e) {
      setInfoError((e as Error).message || 'Failed to load word info')
    } finally {
      setInfoLoading(false)
    }
  }

  // Track running char index so we can extract the surrounding sentence.
  let charCursor = 0

  const panelBody = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-lg font-bold text-filos-primary">{selected?.word ?? 'Word details'}</h3>
          {info && info.lemma && selected && info.lemma.toLocaleLowerCase() !== selected.word.toLocaleLowerCase() && (
            <p className="text-xs text-gray-400">base form: {info.lemma}</p>
          )}
        </div>
        {selected && (
          <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none lg:hidden">×</button>
        )}
      </div>

      {!selected && <p className="text-sm text-gray-400">Click a word in the text to see its meaning and grammar here.</p>}
      {infoLoading && <p className="text-sm text-gray-400">Loading…</p>}
      {infoError && <p className="text-sm text-red-500">{infoError}</p>}

      {info && (
        <div className="space-y-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-base font-medium text-gray-800">{info.english}</span>
            {info.word_type && (
              <span className="text-xs uppercase tracking-wide text-filos-accent bg-filos-marble px-2 py-0.5 rounded-full">{info.word_type}</span>
            )}
          </div>

          {info.notes && <p className="text-sm text-gray-600 leading-relaxed">{info.notes}</p>}

          {info.tables?.map((table, ti) => (
            <div key={ti}>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{table.title}</h4>
              <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
                {table.headers?.length > 0 && (
                  <thead>
                    <tr className="bg-filos-marble">
                      {table.headers.map((h, hi) => (
                        <th key={hi} className="text-left font-medium text-gray-600 px-2.5 py-1.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {table.rows?.map((row, ri) => (
                    <tr key={ri} className="border-t border-gray-100">
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-2.5 py-1.5 text-gray-700">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </>
  )

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-filos-primary font-headline mb-1">Reading</h1>
      <p className="text-sm text-gray-500 mb-6">
        Paste a story, song lyrics or any text. Filos turns it into interactive {targetLanguage} you can explore word by word.
      </p>

      {active === null ? (
        <div className="space-y-8 max-w-3xl">
          {/* New text form */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 space-y-4">
            <h2 className="text-lg font-semibold text-filos-primary">New reading text</h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5" htmlFor="reading-title">Title</label>
              <input
                id="reading-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. My favourite song"
                className="w-full rounded-lg border border-gray-200 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-filos-primary/40"
              />
            </div>

            <div>
              <span className="block text-sm font-medium text-gray-600 mb-2">Language of your text</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setSource('target')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    source === 'target'
                      ? 'bg-filos-primary text-white border-filos-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-filos-marble'
                  }`}
                >
                  {targetLanguage}
                </button>
                <button
                  onClick={() => setSource('english')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    source === 'english'
                      ? 'bg-filos-primary text-white border-filos-primary'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-filos-marble'
                  }`}
                >
                  English
                </button>
              </div>
              {source === 'english' && (
                <p className="text-xs text-gray-400 mt-2">Your text will be translated into {targetLanguage} first.</p>
              )}
            </div>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              placeholder={source === 'english' ? 'Enter your English text…' : `Enter your ${targetLanguage} text…`}
              className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-filos-primary/40 resize-y"
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleCreate}
              disabled={saving || !input.trim()}
              className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-filos-primary text-white text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Preparing…' : 'Start Reading'}
            </button>
          </div>

          {/* Saved texts list */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-filos-primary mb-3">My reading texts</h2>
            {listLoading ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-gray-400">No saved texts yet. Create one above to get started.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-100">
                    <th className="py-2 pr-3 font-medium">Title</th>
                    <th className="py-2 px-3 font-medium whitespace-nowrap">Date saved</th>
                    <th className="py-2 pl-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-gray-50 last:border-0 hover:bg-filos-marble/60 transition">
                      <td className="py-2.5 pr-3">
                        <button
                          onClick={() => handleOpenById(it.id)}
                          disabled={opening}
                          className="text-left text-filos-primary font-medium hover:underline disabled:opacity-50"
                        >
                          {it.title || 'Untitled'}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{formatDate(it.created_at)}</td>
                      <td className="py-2.5 pl-3 text-right">
                        <button
                          onClick={() => handleDelete(it.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                          title="Delete"
                          aria-label="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Reading column */}
          <div className="flex-1 min-w-0 space-y-4 w-full">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button onClick={backToList} className="text-sm text-filos-primary hover:underline">
                ← Back to my texts
              </button>
              <button
                onClick={() => setShowTranslation((s) => !s)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-filos-marble hover:text-filos-primary transition"
              >
                {showTranslation ? 'Hide English translation' : 'Show English translation'}
              </button>
            </div>

            {active.title && <h2 className="text-xl font-semibold text-gray-800">{active.title}</h2>}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6 leading-loose text-gray-800 whitespace-pre-wrap text-lg">
              {tokens.map((tok, i) => {
                if (!tok.isWord) {
                  charCursor += tok.text.length
                  return <span key={i}>{tok.text}</span>
                }
                const at = charCursor
                charCursor += tok.text.length
                const isActive = selected?.word === tok.text && selected?.key === tok.text.toLocaleLowerCase()
                return (
                  <span
                    key={i}
                    onClick={() => selectWord(tok.text, at)}
                    className={`cursor-pointer rounded transition hover:underline hover:text-filos-primary ${
                      isActive ? 'bg-filos-primary/15 text-filos-primary underline' : ''
                    }`}
                  >
                    {tok.text}
                  </span>
                )
              })}
            </div>

            {showTranslation && (
              <div className="bg-filos-marble rounded-2xl border border-gray-100 p-5 sm:p-6 leading-relaxed text-gray-600 whitespace-pre-wrap">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">English translation</h4>
                {active.english_text}
              </div>
            )}

            <p className="text-xs text-gray-400">Click any word to see its details.</p>
          </div>

          {/* Info panel — sticky sidebar on desktop */}
          <aside className="hidden lg:block lg:w-96 flex-shrink-0 sticky top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {panelBody}
            </div>
          </aside>
        </div>
      )}

      {/* Info panel — bottom sheet on mobile */}
      {active && selected && (
        <div className="lg:hidden fixed z-50 inset-x-0 bottom-0 max-h-[70vh] overflow-y-auto bg-white rounded-t-2xl shadow-xl border border-gray-100 p-5">
          {panelBody}
        </div>
      )}
    </div>
  )
}
