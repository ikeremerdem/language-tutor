import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Word, WordCreate, WordUpdate, WordType } from '../types'
import { getWords, addWord, updateWord, deleteWord } from '../api/client'
import WordForm from '../components/WordForm'
import BulkWordForm from '../components/BulkWordForm'
import PackageWordForm from '../components/PackageWordForm'
import WordTable from '../components/WordTable'
import { useTutor } from '../context/TutorContext'

const PAGE_SIZE = 20

export default function VocabularyPage() {
  const { tutorId, targetLanguage } = useTutor()
  const [searchParams] = useSearchParams()
  const [words, setWords] = useState<Word[]>([])
  const initialMode = searchParams.get('mode') === 'package' ? 'package' : 'single'
  const [addMode, setAddMode] = useState<'single' | 'multiple' | 'package'>(initialMode)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<WordType | ''>('')
  const [perfFilter, setPerfFilter] = useState<'all' | 'new' | 'struggling' | 'learning' | 'learned'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'az' | 'za' | 'asked_desc' | 'asked_asc' | 'accuracy_desc' | 'accuracy_asc' | 'streak_desc' | 'streak_asc'>('newest')

  const STREAK_LEARN_THRESHOLD = 5
  const [page, setPage] = useState(1)

  const load = async () => setWords(await getWords(tutorId))

  useEffect(() => { load() }, [tutorId])

  const allCategories = useMemo(() => {
    const cats = new Set<string>()
    words.forEach((w) => (w.categories ?? []).forEach((c) => cats.add(c)))
    return Array.from(cats).sort()
  }, [words])

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
    else if (perfFilter === 'struggling') result = result.filter((w) => w.times_asked > 0 && w.current_streak === 0)
    else if (perfFilter === 'learning') result = result.filter((w) => w.current_streak > 0 && w.current_streak < STREAK_LEARN_THRESHOLD)
    else if (perfFilter === 'learned') result = result.filter((w) => w.current_streak >= STREAK_LEARN_THRESHOLD)
    if (categoryFilter) result = result.filter((w) => (w.categories ?? []).includes(categoryFilter))

    const accuracy = (w: Word) => w.times_asked === 0 ? -1 : w.times_correct / w.times_asked

    const sorted = [...result]
    if (sortBy === 'newest') sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
    else if (sortBy === 'oldest') sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
    else if (sortBy === 'az') sorted.sort((a, b) => a.english.localeCompare(b.english))
    else if (sortBy === 'za') sorted.sort((a, b) => b.english.localeCompare(a.english))
    else if (sortBy === 'asked_desc') sorted.sort((a, b) => b.times_asked - a.times_asked)
    else if (sortBy === 'asked_asc') sorted.sort((a, b) => a.times_asked - b.times_asked)
    else if (sortBy === 'accuracy_desc') sorted.sort((a, b) => accuracy(b) - accuracy(a))
    else if (sortBy === 'accuracy_asc') sorted.sort((a, b) => accuracy(a) - accuracy(b))
    else if (sortBy === 'streak_desc') sorted.sort((a, b) => b.current_streak - a.current_streak)
    else if (sortBy === 'streak_asc') sorted.sort((a, b) => a.current_streak - b.current_streak)
    return sorted
  }, [words, search, typeFilter, perfFilter, categoryFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, typeFilter, perfFilter, categoryFilter, sortBy])

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
            onClick={() => setAddMode('multiple')}
            className={`px-4 py-1.5 transition ${addMode === 'multiple' ? 'bg-filos-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Multiple
          </button>
          <button
            onClick={() => setAddMode('package')}
            className={`px-4 py-1.5 transition ${addMode === 'package' ? 'bg-filos-primary text-white' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Load Package
          </button>
        </div>
      </div>
      {addMode === 'single' && <WordForm words={words} onSubmit={handleAdd} />}
      {addMode === 'multiple' && <BulkWordForm words={words} onDone={load} />}
      {addMode === 'package' && <PackageWordForm words={words} onDone={load} />}

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="text-sm text-gray-400 font-medium">
          {filtered.length} word{filtered.length !== 1 ? 's' : ''}
          {filtered.length !== words.length && ` (of ${words.length} total)`}
        </div>
        <div className="flex-1" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
          <option value="asked_desc">Most asked</option>
          <option value="asked_asc">Least asked</option>
          <option value="accuracy_desc">Highest accuracy</option>
          <option value="accuracy_asc">Lowest accuracy</option>
          <option value="streak_desc">Highest streak</option>
          <option value="streak_asc">Lowest streak</option>
        </select>
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
          <option value="struggling">Struggling</option>
          <option value="learning">Learning</option>
          <option value="learned">Learned</option>
        </select>
        {allCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
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
