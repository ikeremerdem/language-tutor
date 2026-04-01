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
    <div className="min-h-screen bg-filos-marble flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <FilosLogo size={52} />
        </div>
        <h1 className="text-2xl font-bold text-filos-primary text-center font-headline mb-1">Welcome back</h1>
        <p className="text-gray-400 text-sm text-center mb-8">Sign in to your Filos account</p>

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
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-filos-primary"
            />
          </div>
          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-filos-primary text-white py-3 rounded-xl font-semibold hover:bg-filos-primary-dark disabled:opacity-40 transition shadow-sm"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-filos-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
