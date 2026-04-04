import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAdminUserStats } from '../api/client'
import type { AdminUserStats } from '../types'

export default function AdminPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<AdminUserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminUserStats()
      .then(setStats)
      .catch((e: Error & { status?: number }) => {
        if (e.status === 403) {
          navigate('/tutors')
        } else {
          setError(e.message)
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-filos-primary font-headline">User Statistics</h2>
        <p className="text-gray-400 text-sm mt-1">{stats.length} registered user{stats.length !== 1 ? 's' : ''}</p>
      </div>

      {loading && (
        <div className="text-gray-400 text-sm">Loading…</div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm">{error}</div>
      )}

      {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Joined</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Languages</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Words</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-right">Sessions</th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr key={s.user_id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td className="px-6 py-3 text-gray-700">{s.email || <span className="text-gray-300 italic">—</span>}</td>
                    <td className="px-6 py-3 text-gray-400">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right font-medium text-filos-primary">{s.language_count}</td>
                    <td className="px-6 py-3 text-right font-medium text-filos-primary">{s.word_count}</td>
                    <td className="px-6 py-3 text-right font-medium text-filos-primary">{s.session_count}</td>
                  </tr>
                ))}
              </tbody>
              {stats.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-100 bg-gray-50">
                    <td className="px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</td>
                    <td />
                    <td className="px-6 py-3 text-right font-semibold text-gray-600">
                      {stats.reduce((n, s) => n + s.language_count, 0)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-600">
                      {stats.reduce((n, s) => n + s.word_count, 0)}
                    </td>
                    <td className="px-6 py-3 text-right font-semibold text-gray-600">
                      {stats.reduce((n, s) => n + s.session_count, 0)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
            </div>
          </div>
      )}
    </div>
  )
}
