import { useEffect, useState } from 'react'
import type { DashboardStats, RecentSession } from '../types'
import { getDashboard, resetStats } from '../api/client'
import StatsChart from '../components/StatsChart'

const STAT_ICONS: Record<string, string> = {
  words: '\u{1F4DA}',
  sessions: '\u{1F3AF}',
  average: '\u{1F4CA}',
  best: '\u{1F3C6}',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    getDashboard().then(setStats)
  }, [])

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetStats()
      const fresh = await getDashboard()
      setStats(fresh)
    } finally {
      setResetting(false)
      setShowConfirm(false)
    }
  }

  if (!stats) {
    return <p className="text-center text-gray-400 py-12">Loading...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-filos-primary">Dashboard</h2>
        {stats.total_sessions > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="text-sm text-red-500 hover:text-red-700 font-medium transition"
          >
            Reset Statistics
          </button>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">Reset Statistics?</h3>
            <p className="text-gray-500 text-sm mb-6">
              This will permanently delete all quiz session history. Your vocabulary will not be affected.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={STAT_ICONS.words} label="Total Words" value={stats.total_words} />
        <StatCard icon={STAT_ICONS.sessions} label="Sessions / Questions" value={`${stats.total_sessions} / ${stats.total_questions}`} />
        <StatCard icon={STAT_ICONS.average} label="Average Score" value={`${stats.average_score}%`} />
        <StatCard icon={STAT_ICONS.best} label="Best Score" value={`${stats.best_score}%`} />
      </div>
      <StatsChart data={stats.weekly_activity} />
      {(stats.recent_sessions.length > 0 || stats.difficult_words.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {stats.recent_sessions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Recent Sessions</h3>
              <div className="space-y-1.5">
                {stats.recent_sessions.map((s) => (
                  <RecentSessionRow key={s.id} s={s} />
                ))}
              </div>
            </div>
          )}
          {stats.difficult_words.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Top 10 Difficult Words</h3>
              <div className="space-y-1.5">
                {stats.difficult_words.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-2.5 bg-filos-marble rounded-lg hover:bg-filos-surface transition">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-800 truncate block">{w.english}</span>
                      <span className="text-xs text-gray-400">{w.greek}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{w.times_correct}/{w.times_asked}</span>
                      <span className={`font-bold text-sm ${w.success_percent >= 70 ? 'text-green-600' : w.success_percent >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {w.success_percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-bold text-filos-primary font-headline">{value}</p>
    </div>
  )
}

function RecentSessionRow({ s }: { s: RecentSession }) {
  return (
    <div className="flex items-center justify-between p-2.5 bg-filos-marble rounded-lg hover:bg-filos-surface transition">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 ${
          s.quiz_type === 'word' ? 'bg-filos-primary/10 text-filos-primary' : 'bg-filos-accent/10 text-filos-accent'
        }`}>
          {s.quiz_type === 'word' ? 'W' : 'S'}
        </span>
        <span className="text-sm text-gray-600">{s.correct_answers}/{s.total_questions}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-bold text-sm ${s.score_percent >= 80 ? 'text-green-600' : s.score_percent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
          {s.score_percent}%
        </span>
        <span className="text-xs text-gray-400 w-16 text-right">
          {s.ended_at ? new Date(s.ended_at).toLocaleDateString() : ''}
        </span>
      </div>
    </div>
  )
}
