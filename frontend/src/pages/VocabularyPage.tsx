import { useEffect, useState, useMemo } from 'react'
import type { Word, WordCreate, WordUpdate, WordType } from '../types'
import { getWords, addWord, updateWord, deleteWord } from '../api/client'
import WordForm from '../components/WordForm'
import BulkWordForm from '../components/BulkWordForm'
import WordTable from '../components/WordTable'
import { useTutor } from '../context/TutorContext'

const PAGE_SIZE = 20

export default function VocabularyPage() {
  const { tutorId, targetLanguage } = useTutor()
  const [words, setWords] = useState<Word[]>([])
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<WordType | ''>('')
  const [perfFilter, setPerfFilter] = useState<'all' | 'new' | 'good' | 'struggling'>('all')
  const [page, setPage] = useState(1)

  const load = async () => setWords(await getWords(tutorId))

  useEffect(() => { load() }, [tutorId])

  const filtered = useMemo(() => {
    let result = words
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (w) => w.english.toLowerCase().includes(q) || w.target_language.toLowerCase().includes(q)
      )
    }
    if (typeFilter) result = result.filter((w) => w.word_type === typeFilter)
    if (perfFilter === 'new') result = result.filter((w) => w.times_asked === 0)
    else if (perfFilter === 'good') result = result.filter((w) => w.times_asked > 0 && (w.times_correct / w.times_asked) >= 0.8)
    else if (perfFilter === 'struggling') result = result.filter((w) => w.times_asked > 0 && (w.times_correct / w.times_asked) < 0.8)
    return result
  }, [words, search, typeFilter, perfFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, typeFilter, perfFilter])

  const handleAdd = async (data: WordCreate) => { await addWord(tutorId, data); await load() }
  const handleUpdate = async (id: string, data: WordUpdate) => { await updateWord(tutorId, id, data); await load() }
  const handleDelete = async (id: string) => { await deleteWord(tutorId, id); await load() }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-filos-primary">Vocabulary</h2>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
          <button
            onClick={() => setAddMode('single')}
            className={`px-4 py-1.5 transition ${addMode === 'single' ? 'bg-filos-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Single
          </button>
          <button
            onClick={() => setAddMode('bulk')}
            className={`px-4 py-1.5 transition ${addMode === 'bulk' ? 'bg-filos-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Bulk
          </button>
        </div>
      </div>
      {addMode === 'single'
        ? <WordForm words={words} onSubmit={handleAdd} />
        : <BulkWordForm words={words} onDone={load} />
      }

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="text-sm text-gray-400 font-medium">
          {filtered.length} word{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== words.length && ` (of ${words.length} total)`}
        </div>
        <div className="flex-1" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64"
          placeholder={`Search English or ${targetLanguage}…`}
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as WordType | '')}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {['verb', 'noun', 'adjective', 'adverb', 'preposition', 'other'].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={perfFilter}
          onChange={(e) => setPerfFilter(e.target.value as typeof perfFilter)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="all">All words</option>
          <option value="new">New</option>
          <option value="good">Correct ≥ 80%</option>
          <option value="struggling">Correct &lt; 80%</option>
        </select>
      </div>

      <WordTable words={paged} onUpdate={handleUpdate} onDelete={handleDelete} />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-5">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition shadow-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition shadow-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
