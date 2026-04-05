import { useEffect, useRef, useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import type { ConversationMessage, Persona } from '../types'
import { getConversationMessages, sendConversationMessage, translateSentence } from '../api/client'
import { useTutor } from '../context/TutorContext'

interface LocationState {
  personaName?: string
  firstMessage?: string
  firstMessageTranslation?: string
  persona?: Persona
}

function PersonaMessage({ msg, persona }: { msg: ConversationMessage; persona?: Persona }) {
  const [showTranslation, setShowTranslation] = useState(false)

  return (
    <div className="flex items-start gap-2 justify-start">
      <div className="w-7 h-7 rounded-full bg-filos-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs overflow-hidden">
        {persona?.image_url
          ? <img src={persona.image_url} alt="" className="w-7 h-7 rounded-full object-cover" />
          : '🧑'}
      </div>
      <div className="max-w-[72%]">
        <div className="bg-white text-gray-800 shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed">
          {msg.content}
        </div>
        {msg.translation && (
          <div className="mt-1">
            <button
              onClick={() => setShowTranslation((v) => !v)}
              className="text-xs text-gray-400 hover:text-filos-primary transition flex items-center gap-1"
            >
              <span>{showTranslation ? '▲' : '▼'}</span>
              <span>{showTranslation ? 'Hide' : 'Help!'}</span>
            </button>
            {showTranslation && (
              <div className="mt-1 px-3 py-2 bg-white/70 border border-gray-100 rounded-xl text-xs text-gray-500 leading-relaxed shadow-sm">
                {msg.translation}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function UserMessage({ msg }: { msg: ConversationMessage }) {
  const hasGrammarResult = msg.grammar_ok !== null

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-end gap-2 justify-end">
        {hasGrammarResult && (
          msg.grammar_ok ? (
            <span className="text-green-500 flex-shrink-0 mb-0.5" title="Grammatically correct">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            <span className="text-amber-400 flex-shrink-0 mb-0.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </span>
          )
        )}
        <div className="max-w-[72%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed bg-filos-primary text-white">
          {msg.content}
        </div>
      </div>
      {!msg.grammar_ok && msg.grammar_explanation && (
        <div className="mt-1 max-w-[72%] px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 leading-relaxed shadow-sm">
          <p className="mb-1">{msg.grammar_explanation}</p>
          {msg.grammar_corrected && (
            <p className="font-semibold text-amber-900">✓ {msg.grammar_corrected}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function ConversationChatPage() {
  const { tutorId, conversationId } = useParams<{ tutorId: string; conversationId: string }>()
  const { targetLanguage } = useTutor()
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state ?? {}) as LocationState

  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [personaName] = useState(state.personaName ?? '')
  const [persona] = useState<Persona | undefined>(state.persona)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [cheatOpen, setCheatOpen] = useState(false)
  const [cheatText, setCheatText] = useState('')
  const [translating, setTranslating] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tutorId || !conversationId) return
    getConversationMessages(tutorId, conversationId).then(setMessages).catch(() => {})
  }, [tutorId, conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || !tutorId || !conversationId) return
    setInput('')
    setSending(true)
    setError('')

    const tempUser: ConversationMessage = {
      id: 'temp-user',
      conversation_id: conversationId,
      role: 'user',
      content: text,
      translation: '',
      grammar_ok: null,
      grammar_explanation: '',
      grammar_corrected: '',
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempUser])

    try {
      const reply = await sendConversationMessage(tutorId, conversationId, text)

      const finalUser: ConversationMessage = {
        ...tempUser,
        grammar_ok: reply.grammar_ok,
        grammar_explanation: reply.grammar_explanation ?? '',
        grammar_corrected: reply.grammar_corrected ?? '',
      }
      const tempPersona: ConversationMessage = {
        id: 'temp-persona',
        conversation_id: conversationId,
        role: 'persona',
        content: reply.content,
        translation: reply.translation ?? '',
        grammar_ok: null,
        grammar_explanation: '',
        grammar_corrected: '',
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev.filter((m) => m.id !== 'temp-user'), finalUser, tempPersona])
    } catch (e) {
      setError((e as Error).message)
      setMessages((prev) => prev.filter((m) => m.id !== 'temp-user'))
      setInput(text)
    } finally {
      setSending(false)
    }
  }

  const handleTranslate = async () => {
    if (!cheatText.trim() || !tutorId) return
    setTranslating(true)
    try {
      const res = await translateSentence(tutorId, cheatText.trim())
      setInput(res.translation)
      setCheatOpen(false)
      setCheatText('')
    } finally {
      setTranslating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const displayName = personaName || persona?.name || 'Persona'

  return (
    <div className="max-w-2xl mx-auto flex flex-col h-[calc(100vh-160px)] min-h-[480px]">
      {/* Header */}
      <div className="bg-white rounded-t-2xl shadow-sm px-5 py-4 flex items-center gap-3 border-b border-gray-100">
        <button
          onClick={() => navigate(`/tutors/${tutorId}/conversation`)}
          className="text-gray-400 hover:text-filos-primary transition mr-1"
          aria-label="Back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        {persona?.image_url ? (
          <img src={persona.image_url} alt={persona.name} className="w-9 h-9 rounded-full object-cover border border-gray-100 flex-shrink-0" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-filos-primary/10 flex items-center justify-center flex-shrink-0 text-base">🧑</div>
        )}
        <div>
          <p className="font-semibold text-gray-800 leading-tight">{displayName}</p>
          {persona && <p className="text-xs text-gray-400">{persona.name} · {targetLanguage}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-filos-marble px-4 py-4 space-y-3">
        {messages.map((msg) =>
          msg.role === 'persona' ? (
            <PersonaMessage key={msg.id} msg={msg} persona={persona} />
          ) : (
            <UserMessage key={msg.id} msg={msg} />
          )
        )}
        {sending && (
          <div className="flex items-start gap-2 justify-start">
            <div className="w-7 h-7 rounded-full bg-filos-primary/10 flex items-center justify-center flex-shrink-0 text-xs">🧑</div>
            <div className="bg-white text-gray-400 shadow-sm rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm">…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white rounded-b-2xl shadow-sm px-4 py-3 border-t border-gray-100">
        {error && <p className="text-red-500 text-xs mb-2">{error}</p>}
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
            placeholder={`Reply in ${targetLanguage}…`}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-filos-primary disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="bg-filos-primary text-white p-2.5 rounded-xl hover:bg-filos-primary-dark disabled:opacity-40 transition flex-shrink-0"
            aria-label="Send"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
          <button
            onClick={() => { setCheatOpen((v) => !v); setCheatText('') }}
            className={`p-2.5 rounded-xl border transition flex-shrink-0 ${cheatOpen ? 'bg-amber-50 border-amber-300 text-amber-500' : 'border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}
            title="Cheat — translate from English"
            aria-label="Cheat"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        </div>

        {cheatOpen && (
          <div className="mt-2 flex gap-2 items-center">
            <input
              value={cheatText}
              onChange={(e) => setCheatText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
              placeholder="Type in English…"
              className="flex-1 border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-400 placeholder-amber-300"
              autoFocus
            />
            <button
              onClick={handleTranslate}
              disabled={!cheatText.trim() || translating}
              className="px-3 py-2 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition whitespace-nowrap"
            >
              {translating ? '…' : 'Translate'}
            </button>
          </div>
        )}

        <p className="text-xs text-gray-300 mt-1.5 text-right">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
