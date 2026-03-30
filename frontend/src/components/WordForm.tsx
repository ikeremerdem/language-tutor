import { useState } from 'react'
import type { Word, WordCreate, WordType } from '../types'
import { lookupWord } from '../api/client'

const WORD_TYPES: WordType[] = ['verb', 'noun', 'adjective', 'adverb', 'preposition', 'other']

interface Props {
  words: Word[]
  onSubmit: (data: WordCreate) => Promise<void>
}

export default function WordForm({ words, onSubmit }: Props) {
  const [wordType, setWordType] = useState<WordType>('noun')
  const [english, setEnglish] = useState('')
  const [greek, setGreek] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [error, setError] = useState('')
  const [duplicate, setDuplicate] = useState<Word | null>(null)

  const handleLookup = async () => {
    if (!english.trim()) return
    setError('')
    setDuplicate(null)

    const existing = words.find(
      (w) => w.english.toLowerCase() === english.trim().toLowerCase()
    )
    if (existing) {
      setDuplicate(existing)
    }

    setLookingUp(true)
    try {
      const result = await lookupWord(english.trim())
      setGreek(result.greek)
      setWordType(result.word_type)
      setNotes(result.notes)
    } catch {
      // leave fields for manual entry
    } finally {
      setLookingUp(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (!greek) {
        handleLookup()
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!english.trim() || !greek.trim()) return
    setLoading(true)
    setError('')
    try {
      await onSubmit({ word_type: wordType, english, greek, notes })
      setEnglish('')
      setGreek('')
      setNotes('')
      setDuplicate(null)
    } catch (e) {
      const msg = (e as Error).message
      if (msg.includes('already exists')) {
        setError(`"${english.trim()}" is already in your vocabulary.`)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold mb-4 text-filos-primary font-headline">Add New Word</h2>
      <div className="flex gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-600 mb-1">English</label>
          <input
            value={english}
            onChange={(e) => { setEnglish(e.target.value); setDuplicate(null); setError('') }}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
            placeholder="Type an English word and press Lookup"
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleLookup}
            disabled={lookingUp || !english.trim()}
            className="bg-filos-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-filos-primary-dark disabled:opacity-40 transition shadow-sm"
          >
            {lookingUp ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </div>
      {duplicate && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          This word already exists: <strong>{duplicate.english}</strong> = <strong>{duplicate.greek}</strong> ({duplicate.word_type}{duplicate.notes ? `, ${duplicate.notes}` : ''})
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
          <select
            value={wordType}
            onChange={(e) => setWordType(e.target.value as WordType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
          >
            {WORD_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Greek</label>
          <input
            value={greek}
            onChange={(e) => setGreek(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
            placeholder="auto-filled by lookup"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
            placeholder="article, verb type, etc."
          />
        </div>
      </div>
      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !english.trim() || !greek.trim()}
        className="mt-5 bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40 transition shadow-sm"
      >
        {loading ? 'Adding...' : 'Add Word'}
      </button>
    </form>
  )
}
