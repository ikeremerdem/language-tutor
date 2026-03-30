import { useState } from 'react'
import type { Word, WordUpdate } from '../types'

const TYPE_COLORS: Record<string, string> = {
  verb: 'bg-violet-100 text-violet-700',
  noun: 'bg-blue-100 text-blue-700',
  adjective: 'bg-emerald-100 text-emerald-700',
  adverb: 'bg-amber-100 text-amber-700',
  preposition: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-600',
}

interface Props {
  words: Word[]
  onUpdate: (id: string, data: WordUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function AccuracyBadge({ word }: { word: Word }) {
  if (word.times_asked === 0) {
    return <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">--</span>
  }
  const pct = Math.round((word.times_correct / word.times_asked) * 100)
  const color =
    pct >= 80 ? 'bg-emerald-100 text-emerald-700' :
    pct >= 50 ? 'bg-amber-100 text-amber-700' :
    'bg-red-100 text-red-700'
  return <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${color}`}>{pct}%</span>
}

export default function WordTable({ words, onUpdate, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<WordUpdate>({})

  const startEdit = (word: Word) => {
    setEditingId(word.id)
    setEditData({
      word_type: word.word_type,
      english: word.english,
      greek: word.greek,
      notes: word.notes,
    })
  }

  const saveEdit = async () => {
    if (!editingId) return
    await onUpdate(editingId, editData)
    setEditingId(null)
  }

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
        No words yet. Add some words above to get started!
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">English</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Greek</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Asked</th>
            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Accuracy</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {words.map((word) => (
            <tr key={word.id} className="hover:bg-filos-surface/60 transition-colors">
              {editingId === word.id ? (
                <>
                  <td className="px-5 py-2">
                    <select
                      value={editData.word_type}
                      onChange={(e) => setEditData({ ...editData, word_type: e.target.value as Word['word_type'] })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                    >
                      {['verb', 'noun', 'adjective', 'adverb', 'preposition', 'other'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-2">
                    <input
                      value={editData.english}
                      onChange={(e) => setEditData({ ...editData, english: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                    />
                  </td>
                  <td className="px-5 py-2">
                    <input
                      value={editData.greek}
                      onChange={(e) => setEditData({ ...editData, greek: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                    />
                  </td>
                  <td className="px-5 py-2">
                    <input
                      value={editData.notes}
                      onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                      className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-full"
                    />
                  </td>
                  <td className="px-5 py-2 text-center text-sm text-gray-500">{word.times_asked}</td>
                  <td className="px-5 py-2 text-center"><AccuracyBadge word={word} /></td>
                  <td className="px-5 py-2 text-right space-x-1">
                    <button onClick={saveEdit} className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition" title="Save">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition" title="Cancel">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5"><path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" /></svg>
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${TYPE_COLORS[word.word_type] || TYPE_COLORS.other}`}>
                      {word.word_type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{word.english}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-filos-primary">{word.greek}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{word.notes}</td>
                  <td className="px-5 py-3.5 text-center text-sm text-gray-500">{word.times_asked}</td>
                  <td className="px-5 py-3.5 text-center"><AccuracyBadge word={word} /></td>
                  <td className="px-5 py-3.5 text-right space-x-1">
                    <button onClick={() => startEdit(word)} className="p-1.5 rounded-lg text-gray-400 hover:text-filos-primary hover:bg-filos-surface transition" title="Edit">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5"><path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" /></svg>
                    </button>
                    <button onClick={() => onDelete(word.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition" title="Delete">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4.5 h-4.5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.519.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 1 .7.797l-.375 5a.75.75 0 0 1-1.495-.112l.375-5a.75.75 0 0 1 .795-.684Zm3.635.684a.75.75 0 1 0-1.495.112l.375 5a.75.75 0 1 0 1.495-.112l-.375-5Z" clipRule="evenodd" /></svg>
                    </button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
