import { useEffect, useState, useMemo } from 'react'
import type { Word, WordCreate, WordUpdate, WordType } from '../types'
import { getWords, addWord, updateWord, deleteWord } from '../api/client'
import WordForm from '../components/WordForm'
import WordTable from '../components/WordTable'

const PAGE_SIZE = 20

export default function VocabularyPage() {
  const [words, setWords] = useState<Word[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<WordType | ''>('')
  const [page, setPage] = useState(1)

  const load = async () => {
    setWords(await getWords())
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    let result = words
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (w) => w.english.toLowerCase().includes(q) || w.greek.toLowerCase().includes(q)
      )
    }
    if (typeFilter) {
      result = result.filter((w) => w.word_type === typeFilter)
    }
    return result
  }, [words, search, typeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, typeFilter])

  const handleAdd = async (data: WordCreate) => {
    await addWord(data)
    await load()
  }

  const handleUpdate = async (id: string, data: WordUpdate) => {
    await updateWord(id, data)
    await load()
  }

  const handleDelete = async (id: string) => {
    await deleteWord(id)
    await load()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-filos-primary mb-6">Vocabulary</h2>
      <WordForm words={words} onSubmit={handleAdd} />

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
          placeholder="Search English or Greek..."
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
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
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
