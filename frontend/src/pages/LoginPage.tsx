import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FilosLogo from '../components/FilosLogo'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/tutors')
    }
  }

  return (
    <div className="min-h-screen bg-filos-marble flex flex-col">

      {/* Hero */}
      <div
        className="flex flex-col items-center text-center px-6 pt-14 pb-24"
        style={{ background: 'linear-gradient(160deg, #004688 0%, #0A2540 100%)' }}
      >
        {/* Logo + wordmark */}
        <div className="flex items-center gap-3 mb-10">
          <FilosLogo size={44} />
          <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Manrope, sans-serif' }}>
            Filos
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-white text-3xl font-extrabold leading-tight mb-4 max-w-xs"
          style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 800 }}
        >
          Tired of language apps that feel like a game?
        </h1>

        {/* Terracotta accent line */}
        <div className="w-10 h-0.5 rounded-full mb-4" style={{ backgroundColor: '#C15A1A' }} />

        {/* Sub-copy */}
        <p className="text-white/80 text-base leading-relaxed max-w-xs mb-5" style={{ fontFamily: 'Inter, sans-serif' }}>
          Filos is for learners who study in a real class and want to practice the vocabulary they've actually learned — not random words from an algorithm.
        </p>

        {/* Origin note */}
        <p className="text-white/55 text-sm italic" style={{ fontFamily: 'Inter, sans-serif' }}>
          Born from Greek lessons. Now supporting German, French, Italian &amp; Spanish.
        </p>
      </div>

      {/* Login card — overlaps hero with negative margin */}
      <div className="px-4 -mt-10 flex flex-col items-center">
        <div className="bg-white rounded-2xl w-full max-w-sm p-8" style={{ boxShadow: '0 8px 40px 0 rgba(0,70,136,0.10)' }}>

          <p
            className="text-xs font-semibold tracking-widest mb-5"
            style={{ fontFamily: 'Inter, sans-serif', color: '#004688', letterSpacing: '0.1em' }}
          >
            SIGN IN
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#727783', fontFamily: 'Inter, sans-serif' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{
                  border: '1.5px solid #F0EDE8',
                  backgroundColor: '#F8F6F2',
                  color: '#171C1F',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#004688')}
                onBlur={e => (e.currentTarget.style.borderColor = '#F0EDE8')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#727783', fontFamily: 'Inter, sans-serif' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition"
                style={{
                  border: '1.5px solid #F0EDE8',
                  backgroundColor: '#F8F6F2',
                  color: '#171C1F',
                  fontFamily: 'Inter, sans-serif',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#004688')}
                onBlur={e => (e.currentTarget.style.borderColor = '#F0EDE8')}
              />
            </div>

            {error && (
              <p className="text-sm rounded-xl p-3" style={{ backgroundColor: '#FDECEA', color: '#BA1A1A', fontFamily: 'Inter, sans-serif' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold py-3 rounded-xl transition disabled:opacity-40"
              style={{ backgroundColor: '#004688', fontFamily: 'Inter, sans-serif' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ backgroundColor: '#F0EDE8' }} />
            <span className="text-xs" style={{ color: '#727783', fontFamily: 'Inter, sans-serif' }}>or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: '#F0EDE8' }} />
          </div>

          {/* Try for free CTA */}
          <Link
            to="/register"
            className="block w-full text-center font-semibold py-3 rounded-xl transition"
            style={{ backgroundColor: '#C15A1A', color: '#FFFFFF', fontFamily: 'Inter, sans-serif' }}
          >
            Try it for free →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto text-center py-8 px-6 space-y-1">
        <p className="text-xs" style={{ color: '#727783', fontFamily: 'Inter, sans-serif' }}>
          Filos &middot; Your language companion &middot; kaloma.ai
        </p>
        <p className="text-xs max-w-sm mx-auto" style={{ color: '#727783', fontFamily: 'Inter, sans-serif' }}>
          A pet project by Kerem Erdem, maintained on a best-effort basis. No security audit. Provided as-is.{' '}
          <a href="mailto:languagetutor@kaloma.ai" className="underline hover:opacity-70 transition">
            languagetutor@kaloma.ai
          </a>
        </p>
      </footer>
    </div>
  )
}
