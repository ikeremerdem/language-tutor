import { useState } from 'react'
import type { Word, WordCreate, WordType } from '../types'
import { lookupWord, lookupWordReverse } from '../api/client'
import { useTutor } from '../context/TutorContext'
import TagInput from './TagInput'

const WORD_TYPES: WordType[] = ['verb', 'noun', 'adjective', 'adverb', 'preposition', 'other']

interface Props {
  words: Word[]
  onSubmit: (data: WordCreate) => Promise<void>
}

export default function WordForm({ words, onSubmit }: Props) {
  const { tutorId, targetLanguage } = useTutor()
  const [wordType, setWordType] = useState<WordType>('noun')
  const [english, setEnglish] = useState('')
  const [targetWord, setTargetWord] = useState('')
  const [notes, setNotes] = useState('')
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)
  const [lookingUpReverse, setLookingUpReverse] = useState(false)
  const [error, setError] = useState('')
  const [duplicate, setDuplicate] = useState<Word | null>(null)

  const handleLookup = async () => {
    if (!english.trim()) return
    setError('')
    setDuplicate(null)
    const existing = words.find((w) => w.english.toLowerCase() === english.trim().toLowerCase())
    if (existing) setDuplicate(existing)
    setLookingUp(true)
    try {
      const result = await lookupWord(tutorId, english.trim())
      setTargetWord(result.target_language)
      setWordType(result.word_type)
      setNotes(result.notes)
    } catch {
      // leave fields for manual entry
    } finally {
      setLookingUp(false)
    }
  }

  const handleLookupReverse = async () => {
    if (!targetWord.trim()) return
    setError('')
    setLookingUpReverse(true)
    try {
      const result = await lookupWordReverse(tutorId, targetWord.trim())
      setEnglish(result.english)
      setWordType(result.word_type)
      setNotes(result.notes)
      setDuplicate(words.find((w) => w.english.toLowerCase() === result.english.toLowerCase()) ?? null)
    } catch {
      // leave fields for manual entry
    } finally {
      setLookingUpReverse(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); if (!targetWord) handleLookup() }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!english.trim() || !targetWord.trim()) return
    setLoading(true)
    setError('')
    try {
      await onSubmit({ word_type: wordType, english, target_language: targetWord, notes, categories })
      setEnglish(''); setTargetWord(''); setNotes(''); setCategories([]); setDuplicate(null)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg.includes('already exists') ? `"${english.trim()}" is already in your vocabulary.` : msg)
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
            {lookingUp ? 'Looking up…' : 'Lookup'}
          </button>
        </div>
      </div>
      {duplicate && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm">
          This word already exists: <strong>{duplicate.english}</strong> = <strong>{duplicate.target_language}</strong>{' '}
          ({duplicate.word_type}{duplicate.notes ? `, ${duplicate.notes}` : ''})
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Type</label>
          <select value={wordType} onChange={(e) => setWordType(e.target.value as WordType)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5">
            {WORD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">{targetLanguage}</label>
          <div className="flex gap-2">
            <input value={targetWord} onChange={(e) => setTargetWord(e.target.value)} className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5" placeholder="auto-filled by lookup" />
            <button
              type="button"
              onClick={handleLookupReverse}
              disabled={lookingUpReverse || !targetWord.trim()}
              className="px-3 py-2.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-500 hover:border-filos-primary hover:text-filos-primary disabled:opacity-40 transition whitespace-nowrap"
              title={`Look up this ${targetLanguage} word`}
            >
              {lookingUpReverse ? '…' : '← Lookup'}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5" placeholder="article, verb type, etc." />
        </div>
      </div>
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-600 mb-1">Categories</label>
        <TagInput tags={categories} onChange={setCategories} placeholder="travel, food, … (Enter or comma to add)" />
      </div>
      {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !english.trim() || !targetWord.trim()}
        className="mt-5 bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-40 transition shadow-sm"
      >
        {loading ? 'Adding…' : 'Add Word'}
      </button>
    </form>
  )
}
