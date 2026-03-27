import { useEffect, useState } from 'react'
import type { DashboardStats } from '../types'
import { getDashboard } from '../api/client'
import StatsChart from '../components/StatsChart'

const STAT_ICONS: Record<string, string> = {
  words: '\u{1F4DA}',
  sessions: '\u{1F3AF}',
  average: '\u{1F4CA}',
  best: '\u{1F3C6}',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)

  useEffect(() => {
    getDashboard().then(setStats)
  }, [])

  if (!stats) {
    return <p className="text-center text-gray-400 py-12">Loading...</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={STAT_ICONS.words} label="Total Words" value={stats.total_words} />
        <StatCard icon={STAT_ICONS.sessions} label="Quiz Sessions" value={stats.total_sessions} />
        <StatCard icon={STAT_ICONS.average} label="Average Score" value={`${stats.average_score}%`} />
        <StatCard icon={STAT_ICONS.best} label="Best Score" value={`${stats.best_score}%`} />
      </div>
      <StatsChart data={stats.weekly_activity} />
      {stats.recent_sessions.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Sessions</h3>
          <div className="space-y-2">
            {stats.recent_sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-lg hover:bg-greek-sky/50 transition">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    s.quiz_type === 'word' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'
                  }`}>
                    {s.quiz_type === 'word' ? 'W' : 'S'}
                  </span>
                  <span className="text-sm text-gray-600">
                    {s.correct_answers}/{s.total_questions} correct
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold text-lg ${s.score_percent >= 80 ? 'text-green-600' : s.score_percent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                    {s.score_percent}%
                  </span>
                  <span className="text-xs text-gray-400">
                    {s.ended_at ? new Date(s.ended_at).toLocaleDateString() : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
    </div>
  )
}
