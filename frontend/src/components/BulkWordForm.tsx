import { useState } from 'react'
import type { Word } from '../types'
import { lookupWord, lookupWordReverse, addWord, addWordCategories } from '../api/client'
import { useTutor } from '../context/TutorContext'
import TagInput from './TagInput'

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
  const { tutorId, targetLanguage } = useTutor()
  const [direction, setDirection] = useState<'english' | 'target'>('english')
  const [text, setText] = useState('')
  const [categories, setCategories] = useState<string[]>([])
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

    const existingEnglishSet = new Set(words.map((w) => w.english.toLowerCase()))
    const existingTargetSet = new Set(words.map((w) => w.target_language.toLowerCase()))

    for (let i = 0; i < lines.length; i++) {
      const word = lines[i]
      updateItem(i, { status: 'processing' })

      if (direction === 'english') {
        // ── English → Target language ──────────────────────────────
        if (existingEnglishSet.has(word.toLowerCase())) {
          if (categories.length > 0) {
            const existing = words.find((w) => w.english.toLowerCase() === word.toLowerCase())
            if (existing) {
              try {
                await addWordCategories(tutorId, existing.id, categories)
                updateItem(i, { status: 'duplicate', detail: 'categories updated' })
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
            categories,
          })
          existingEnglishSet.add(word.toLowerCase())
          updateItem(i, { status: 'added', detail: result.target_language })
        } catch (e) {
          const err = e as Error & { existingId?: string }
          if (err.existingId && categories.length > 0) {
            try {
              await addWordCategories(tutorId, err.existingId, categories)
              updateItem(i, { status: 'duplicate', detail: 'categories updated' })
            } catch {
              updateItem(i, { status: 'duplicate', detail: 'already in vocabulary' })
            }
          } else if (err.message.includes('already exists')) {
            updateItem(i, { status: 'duplicate', detail: 'already in vocabulary' })
          } else {
            updateItem(i, { status: 'error', detail: 'lookup or add failed' })
          }
        }
      } else {
        // ── Target language → English ──────────────────────────────
        if (existingTargetSet.has(word.toLowerCase())) {
          if (categories.length > 0) {
            const existing = words.find((w) => w.target_language.toLowerCase() === word.toLowerCase())
            if (existing) {
              try {
                await addWordCategories(tutorId, existing.id, categories)
                updateItem(i, { status: 'duplicate', detail: 'categories updated' })
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
          const result = await lookupWordReverse(tutorId, word)
          await addWord(tutorId, {
            word_type: result.word_type,
            english: result.english,
            target_language: word,
            notes: result.notes,
            categories,
          })
          existingTargetSet.add(word.toLowerCase())
          updateItem(i, { status: 'added', detail: result.english })
        } catch (e) {
          const err = e as Error & { existingId?: string }
          if (err.existingId && categories.length > 0) {
            try {
              await addWordCategories(tutorId, err.existingId, categories)
              updateItem(i, { status: 'duplicate', detail: 'categories updated' })
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
    }

    setRunning(false)
    setDone(true)
    onDone()
  }

  const handleReset = () => {
    setText('')
    setCategories([])
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

  const placeholder = direction === 'english'
    ? 'apple\nto run\nhappy\nquickly'
    : 'μήλο\nτρέχω\nευτυχισμένος\nγρήγορα'

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-filos-primary font-headline">Add Multiple Words</h2>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
          <button
            onClick={() => { setDirection('english'); handleReset() }}
            className={`px-3 py-1.5 transition ${direction === 'english' ? 'bg-filos-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            English
          </button>
          <button
            onClick={() => { setDirection('target'); handleReset() }}
            className={`px-3 py-1.5 transition ${direction === 'target' ? 'bg-filos-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            {targetLanguage}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {direction === 'english'
          ? 'Enter one English word or phrase per line. Each will be looked up and added automatically.'
          : `Enter one ${targetLanguage} word or phrase per line. Each will be looked up and added automatically.`}
      </p>

      {items.length === 0 ? (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-600 mb-1">Categories <span className="font-normal text-gray-400">(applied to all words)</span></label>
            <TagInput tags={categories} onChange={setCategories} placeholder="travel, food, … (Enter or comma to add)" />
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono resize-y mb-4"
            placeholder={placeholder}
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
