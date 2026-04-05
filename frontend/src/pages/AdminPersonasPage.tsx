import { useEffect, useState } from 'react'
import type { Persona } from '../types'
import {
  adminGetPersonas,
  adminCreatePersona,
  adminUpdatePersona,
  adminDeletePersona,
  adminCreateContext,
  adminDeleteContext,
} from '../api/client'

interface PersonaForm {
  name: string
  description: string
  persona_prompt: string
  image_url: string
}

const emptyForm = (): PersonaForm => ({ name: '', description: '', persona_prompt: '', image_url: '' })

export default function AdminPersonasPage() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PersonaForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [newContextLabel, setNewContextLabel] = useState<Record<string, string>>({})
  const [addingContext, setAddingContext] = useState<string | null>(null)

  const load = () => adminGetPersonas().then(setPersonas).catch(() => {})

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm(emptyForm())
    setEditingId(null)
    setFormMode('create')
    setError('')
  }

  const openEdit = (p: Persona) => {
    setForm({ name: p.name, description: p.description, persona_prompt: p.persona_prompt, image_url: p.image_url })
    setEditingId(p.id)
    setFormMode('edit')
    setError('')
  }

  const closeForm = () => { setFormMode(null); setEditingId(null); setError('') }

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true); setError('')
    try {
      if (formMode === 'create') {
        await adminCreatePersona({ name: form.name.trim(), description: form.description.trim(), persona_prompt: form.persona_prompt.trim(), image_url: form.image_url.trim() })
      } else if (editingId) {
        await adminUpdatePersona(editingId, { name: form.name.trim(), description: form.description.trim(), persona_prompt: form.persona_prompt.trim(), image_url: form.image_url.trim() })
      }
      await load(); closeForm()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    await adminDeletePersona(id); await load(); setDeleteConfirm(null)
  }

  const handleAddContext = async (personaId: string) => {
    const label = (newContextLabel[personaId] ?? '').trim()
    if (!label) return
    setAddingContext(personaId)
    try {
      await adminCreateContext(personaId, label)
      setNewContextLabel((prev) => ({ ...prev, [personaId]: '' }))
      await load()
    } finally {
      setAddingContext(null)
    }
  }

  const handleDeleteContext = async (personaId: string, contextId: string) => {
    await adminDeleteContext(personaId, contextId); await load()
  }

  const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1'

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-filos-primary font-headline">Personas</h2>
          <p className="text-gray-400 text-sm mt-1">Manage conversation personas and their contexts.</p>
        </div>
        {formMode === null && (
          <button onClick={openCreate} className="bg-filos-primary text-white px-5 py-2.5 rounded-xl font-medium hover:bg-filos-primary-dark transition shadow-sm">
            + New Persona
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {formMode !== null && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-base font-semibold text-filos-primary mb-5 font-headline">
            {formMode === 'create' ? 'New Persona' : 'Edit Persona'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Waiter" />
            </div>
            <div>
              <label className={labelCls}>Image URL</label>
              <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={inputCls} placeholder="https://…" />
            </div>
          </div>
          <div className="mb-4">
            <label className={labelCls}>Description (shown to users)</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Friendly waiter at a restaurant…" />
          </div>
          <div className="mb-4">
            <label className={labelCls}>Persona Prompt (LLM instruction)</label>
            <textarea value={form.persona_prompt} onChange={(e) => setForm({ ...form, persona_prompt: e.target.value })} rows={4} className={`${inputCls} resize-y font-mono`} placeholder="You are a friendly waiter at a traditional restaurant. You are helpful, patient, and enthusiastic about the menu…" />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="flex gap-3">
            <button onClick={handleSubmit} disabled={saving} className="bg-filos-primary text-white px-6 py-2.5 rounded-xl font-medium hover:bg-filos-primary-dark disabled:opacity-40 transition">
              {saving ? 'Saving…' : formMode === 'create' ? 'Create' : 'Save Changes'}
            </button>
            <button onClick={closeForm} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition">Cancel</button>
          </div>
        </div>
      )}

      {/* Persona list */}
      <div className="space-y-4">
        {personas.map((p) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-start gap-4">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-full object-cover border border-gray-100 flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-filos-primary/10 flex items-center justify-center flex-shrink-0 text-xl">🧑</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-gray-800">{p.name}</p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => openEdit(p)} className="text-sm text-filos-primary hover:underline font-medium">Edit</button>
                    <button onClick={() => setDeleteConfirm(p.id)} className="text-sm text-red-400 hover:underline font-medium">Delete</button>
                  </div>
                </div>
                {p.description && <p className="text-xs text-gray-400 mb-2">{p.description}</p>}
                {p.persona_prompt && (
                  <p className="text-xs text-gray-300 font-mono truncate mb-3" title={p.persona_prompt}>{p.persona_prompt}</p>
                )}

                {/* Contexts */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Contexts</p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {p.contexts.map((ctx) => (
                      <span key={ctx.id} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-filos-primary/10 text-filos-primary">
                        {ctx.label}
                        <button onClick={() => handleDeleteContext(p.id, ctx.id)} className="ml-1 text-filos-primary/50 hover:text-red-400 transition text-sm leading-none">×</button>
                      </span>
                    ))}
                    {p.contexts.length === 0 && <span className="text-xs text-gray-300 italic">No contexts yet</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      value={newContextLabel[p.id] ?? ''}
                      onChange={(e) => setNewContextLabel((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddContext(p.id)}
                      className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs w-44"
                      placeholder="New context…"
                    />
                    <button
                      onClick={() => handleAddContext(p.id)}
                      disabled={addingContext === p.id || !(newContextLabel[p.id] ?? '').trim()}
                      className="text-xs text-filos-primary font-medium hover:underline disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {personas.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            <p className="text-lg mb-2">No personas yet</p>
            <p className="text-sm">Create your first persona to enable conversations.</p>
          </div>
        )}
      </div>

      {/* Delete modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete this persona?</h3>
            <p className="text-gray-500 text-sm mb-6">All associated contexts and conversations will also be deleted.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
