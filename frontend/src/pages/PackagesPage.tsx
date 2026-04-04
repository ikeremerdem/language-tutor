import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { WordPackageSummary, WordPackageCreate, WordPackageUpdate } from '../types'
import { getPackages, createPackage, updatePackage, deletePackage, generatePackageWords } from '../api/client'
import { useAuth } from '../context/AuthContext'
import FilosLogo from '../components/FilosLogo'

type FormMode = 'create' | 'edit'

interface FormState {
  name: string
  description: string
  category: string
  wordsText: string
  is_public: boolean
}

const emptyForm = (): FormState => ({
  name: '',
  description: '',
  category: '',
  wordsText: '',
  is_public: false,
})

export default function PackagesPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [packages, setPackages] = useState<WordPackageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const load = () =>
    getPackages()
      .then(setPackages)
      .catch(() => {})
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(emptyForm())
    setEditingId(null)
    setFormMode('create')
    setError('')
  }

  const openEdit = (pkg: WordPackageSummary) => {
    // We don't have the words list in summary — fetch them
    import('../api/client').then(({ getPackage }) =>
      getPackage(pkg.id).then((detail) => {
        setForm({
          name: detail.name,
          description: detail.description,
          category: detail.category,
          wordsText: detail.words.join('\n'),
          is_public: detail.is_public,
        })
        setEditingId(pkg.id)
        setFormMode('edit')
        setError('')
      })
    )
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingId(null)
    setError('')
  }

  const parseWords = (text: string) =>
    text.split('\n').map((w) => w.trim()).filter(Boolean)

  const handleGenerateWords = async () => {
    setGenerating(true)
    setError('')
    try {
      const result = await generatePackageWords(form.name, form.description, form.category)
      setForm((prev) => ({ ...prev, wordsText: result.words.join('\n') }))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError('')
    try {
      if (formMode === 'create') {
        const data: WordPackageCreate = {
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          words: parseWords(form.wordsText),
          is_public: form.is_public,
        }
        await createPackage(data)
      } else if (formMode === 'edit' && editingId) {
        const data: WordPackageUpdate = {
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category.trim(),
          words: parseWords(form.wordsText),
          is_public: form.is_public,
        }
        await updatePackage(editingId, data)
      }
      await load()
      closeForm()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await deletePackage(id)
    await load()
    setDeleteConfirm(null)
  }

  const ownPackages = packages.filter((p) => p.user_id === user?.id)
  const othersPackages = packages.filter((p) => p.user_id !== user?.id && p.is_public)

  return (
    <div className="min-h-screen bg-filos-marble">
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tutors')} className="flex items-center gap-3 hover:opacity-80 transition">
              <FilosLogo size={36} />
              <h1 className="text-xl font-bold text-filos-primary font-headline">Filos</h1>
            </button>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-2">Packages</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400 hidden sm:block">{user?.email}</span>
            <button onClick={signOut} className="text-sm text-gray-500 hover:text-filos-primary font-medium transition">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-filos-primary font-headline">Word Packages</h2>
            <p className="text-gray-400 text-sm mt-1">Create and manage packages of English words to import into your vocabulary.</p>
          </div>
          {formMode === null && (
            <button
              onClick={openCreate}
              className="bg-filos-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-filos-primary-dark transition shadow-sm"
            >
              + New Package
            </button>
          )}
        </div>

        {/* Create / Edit form */}
        {formMode !== null && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="text-base font-semibold text-filos-primary mb-5 font-headline">
              {formMode === 'create' ? 'New Package' : 'Edit Package'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. Business Vocabulary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g. business"
                />
              </div>
            </div>
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-500">Description</label>
                <button
                  type="button"
                  onClick={handleGenerateWords}
                  disabled={generating || (!form.description.trim() && !form.name.trim())}
                  className="text-xs text-filos-primary hover:text-filos-primary-dark font-medium disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
                >
                  {generating ? 'Generating…' : '✨ Generate words from description'}
                </button>
              </div>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Short description of this package"
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Words (one English word or phrase per line)
              </label>
              <textarea
                value={form.wordsText}
                onChange={(e) => setForm({ ...form, wordsText: e.target.value })}
                rows={10}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-y"
                placeholder={"to run\nto eat\nhouse\nbeautiful\n..."}
              />
              <p className="text-xs text-gray-400 mt-1">
                {parseWords(form.wordsText).length} word{parseWords(form.wordsText).length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <input
                id="is_public"
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                className="w-4 h-4 accent-filos-primary"
              />
              <label htmlFor="is_public" className="text-sm text-gray-600">
                Make this package public (visible to all users)
              </label>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-filos-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-filos-primary-dark disabled:opacity-40 transition"
              >
                {saving ? 'Saving…' : formMode === 'create' ? 'Create Package' : 'Save Changes'}
              </button>
              <button
                onClick={closeForm}
                className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading && <p className="text-gray-400 text-sm">Loading…</p>}

        {/* My packages */}
        {ownPackages.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Packages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownPackages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isOwn
                  onEdit={() => openEdit(pkg)}
                  onDelete={() => setDeleteConfirm(pkg.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Public packages from others */}
        {othersPackages.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Public Packages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {othersPackages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} isOwn={false} />
              ))}
            </div>
          </div>
        )}

        {!loading && packages.length === 0 && formMode === null && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No packages yet</p>
            <p className="text-sm">Create your first package to get started.</p>
          </div>
        )}
      </main>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete this package?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete the package. Words already imported into vocabularies are not affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="text-center text-xs text-gray-400 py-6 px-6 space-y-1">
        <p>Filos &middot; Word Packages &middot; Powered by kaloma.ai</p>
        <p className="text-gray-300 max-w-2xl mx-auto">
          This is a pet project by Kerem Erdem, maintained on a best-effort basis. It has not undergone a security audit,
          does not guarantee GDPR compliance, and is provided as-is. Use at your own risk.
          For feedback and feature requests, contact{' '}
          <a href="mailto:languagetutor@kaloma.ai" className="hover:text-gray-400 transition underline">languagetutor@kaloma.ai</a>.
        </p>
      </footer>
    </div>
  )
}

function PackageCard({
  pkg,
  isOwn,
  onEdit,
  onDelete,
}: {
  pkg: WordPackageSummary
  isOwn: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-800">{pkg.name}</p>
        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${pkg.is_public ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
          {pkg.is_public ? 'Public' : 'Private'}
        </span>
      </div>
      {pkg.description && <p className="text-xs text-gray-400 leading-snug -mt-1">{pkg.description}</p>}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-filos-primary/10 text-filos-primary">
          {pkg.word_count} words
        </span>
        {pkg.category && (
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            {pkg.category}
          </span>
        )}
      </div>
      {isOwn && (
        <div className="flex gap-2 pt-1 border-t border-gray-50">
          <button
            onClick={onEdit}
            className="flex-1 text-sm text-filos-primary hover:bg-filos-marble rounded-lg py-1.5 font-medium transition"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex-1 text-sm text-red-400 hover:bg-red-50 rounded-lg py-1.5 font-medium transition"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
