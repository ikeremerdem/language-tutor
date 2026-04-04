import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import FilosLogo from '../components/FilosLogo'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/tutors')
    }
  }

  return (
    <div className="min-h-screen bg-filos-marble flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <FilosLogo size={52} />
        </div>
        <h1 className="text-2xl font-bold text-filos-primary text-center font-headline mb-1">Create account</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Start your language learning journey</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-filos-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-filos-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-filos-primary"
            />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-filos-primary text-white py-3 rounded-xl font-semibold hover:bg-filos-primary-dark disabled:opacity-40 transition shadow-sm"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-filos-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
      <footer className="text-center text-xs text-gray-300 py-6 px-6 space-y-1">
        <p>Filos &middot; Your language companion &middot; Powered by kaloma.ai</p>
        <p className="max-w-2xl mx-auto">
          This is a pet project by Kerem Erdem, maintained on a best-effort basis. It has not undergone a security audit,
          does not guarantee GDPR compliance, and is provided as-is. Use at your own risk.
          For feedback and feature requests, contact{' '}
          <a href="mailto:languagetutor@kaloma.ai" className="hover:text-gray-400 transition underline">languagetutor@kaloma.ai</a>.
        </p>
      </footer>
    </div>
  )
}
