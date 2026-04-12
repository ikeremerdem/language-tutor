import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Persona, PersonaContext, RecentSession } from '../types'
import { getPersonas, startConversation, getSessionsByType } from '../api/client'
import { useTutor } from '../context/TutorContext'
import FilosLogo from '../components/FilosLogo'

export default function ConversationSetupPage() {
  const { tutorId, targetLanguage } = useTutor()
  const navigate = useNavigate()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selected, setSelected] = useState<Persona | null>(null)
  const [selectedContext, setSelectedContext] = useState<PersonaContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([])

  useEffect(() => {
    getPersonas().then(setPersonas).catch(() => {})
    getSessionsByType(tutorId, 'conversation').then(setRecentSessions).catch(() => {})
  }, [tutorId])

  const handleSelectPersona = (p: Persona) => {
    setSelected(p)
    setSelectedContext(null)
    setError('')
  }

  const handleStart = async () => {
    if (!selected) return
    setLoading(true)
    setError('')
    try {
      const res = await startConversation(tutorId, {
        persona_id: selected.id,
        context_id: selectedContext?.id,
      })
      navigate(`/tutors/${tutorId}/conversation/${res.conversation_id}`, {
        state: { personaName: res.persona_name, firstMessage: res.first_message, firstMessageTranslation: res.first_message_translation, persona: selected },
      })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
      <div className="w-full max-w-2xl lg:max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          <div className="flex justify-center mb-4"><FilosLogo size={48} /></div>
          <h2 className="text-2xl font-bold text-filos-primary text-center mb-1">Conversation</h2>
          <p className="text-gray-400 text-sm text-center mb-8">Practice your {targetLanguage} in a real-life conversation</p>

          {personas.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-6">No personas available yet. Ask your admin to add some.</p>
          )}

          {/* Persona grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {personas.map((p) => (
              <button
                key={p.id}
                onClick={() => handleSelectPersona(p)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  selected?.id === p.id
                    ? 'border-filos-primary bg-filos-primary/5'
                    : 'border-gray-200 hover:border-filos-primary/40 hover:bg-filos-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-gray-100"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-filos-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
                      🧑
                    </div>
                  )}
                  <div>
                    <p className={`font-semibold text-sm ${selected?.id === p.id ? 'text-filos-primary' : 'text-gray-800'}`}>{p.name}</p>
                    {p.description && <p className="text-xs text-gray-400 leading-snug mt-0.5">{p.description}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Context selection */}
          {selected && selected.contexts.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-600 mb-2">Choose a context</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedContext(null)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${
                    selectedContext === null
                      ? 'border-filos-primary bg-filos-primary/5 text-filos-primary'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  General
                </button>
                {selected.contexts.map((ctx) => (
                  <button
                    key={ctx.id}
                    onClick={() => setSelectedContext(ctx)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition ${
                      selectedContext?.id === ctx.id
                        ? 'border-filos-primary bg-filos-primary/5 text-filos-primary'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {ctx.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3 mb-4">{error}</p>}

          <button
            onClick={handleStart}
            disabled={!selected || loading}
            className="w-full bg-filos-primary text-white py-3.5 rounded-xl font-semibold hover:bg-filos-primary-dark disabled:opacity-40 transition shadow-sm"
          >
            {loading ? 'Starting conversation…' : 'Start Conversation →'}
          </button>
        </div>
      </div>

      {recentSessions.length > 0 && (
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Recent Conversations</h3>
            <div className="space-y-1.5">
              {recentSessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 bg-filos-marble rounded-lg hover:bg-filos-surface transition">
                  <span className="text-sm text-gray-600">{s.correct_answers}/{s.total_questions} correct</span>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-sm ${s.score_percent >= 80 ? 'text-green-600' : s.score_percent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {s.score_percent}%
                    </span>
                    <span className="text-xs text-gray-400 w-16 text-right">
                      {s.ended_at ? new Date(s.ended_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
