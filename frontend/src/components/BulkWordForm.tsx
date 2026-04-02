import { useState } from 'react'
import type { Word } from '../types'
import { lookupWord, addWord } from '../api/client'
import { useTutor } from '../context/TutorContext'

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

export default function BulkWordForm({ words, onDone }: Props) {
  const { tutorId } = useTutor()
  const [text, setText] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)

  const updateItem = (index: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))

  const handleStart = async () => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) return

    const initial: Item[] = lines.map((word) => ({ word, status: 'pending' }))
    setItems(initial)
    setRunning(true)
    setDone(false)

    const existingSet = new Set(words.map((w) => w.english.toLowerCase()))

    for (let i = 0; i < lines.length; i++) {
      const word = lines[i]
      updateItem(i, { status: 'processing' })

      if (existingSet.has(word.toLowerCase())) {
        updateItem(i, { status: 'duplicate', detail: 'already in vocabulary' })
        continue
      }

      try {
        const result = await lookupWord(tutorId, word)
        await addWord(tutorId, {
          word_type: result.word_type,
          english: word,
          target_language: result.target_language,
          notes: result.notes,
        })
        existingSet.add(word.toLowerCase())
        updateItem(i, { status: 'added', detail: result.target_language })
      } catch (e) {
        const msg = (e as Error).message
        if (msg.includes('already exists')) {
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
    setText('')
    setItems([])
    setDone(false)
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-1 text-filos-primary font-headline">Add Multiple Words</h2>
      <p className="text-sm text-gray-400 mb-4">Enter one English word or phrase per line. Each will be looked up and added automatically.</p>

      {items.length === 0 ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono resize-y mb-4"
            placeholder={"apple\nto run\nhappy\nquickly"}
          />
          <button
            onClick={handleStart}
            disabled={!text.trim()}
            className="bg-filos-primary text-white px-6 py-2.5 rounded-lg font-medium hover:bg-filos-primary-dark disabled:opacity-40 transition shadow-sm"
          >
            Add All →
          </button>
        </>
      ) : (
        <>
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
              <button
                onClick={handleReset}
                className="text-sm text-filos-primary font-medium hover:underline"
              >
                Add more
              </button>
            </div>
          )}

          {running && (
            <p className="text-sm text-gray-400 animate-pulse">Processing…</p>
          )}
        </>
      )}
    </div>
  )
}
