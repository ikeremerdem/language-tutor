import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { DashboardStats, RecentSession } from '../types'
import { getDashboard } from '../api/client'
import StatsChart from '../components/StatsChart'
import CategoryPill from '../components/CategoryPill'
import { useTutor } from '../context/TutorContext'

const STAT_ICONS: Record<string, string> = {
  words: '\u{1F4DA}',
  sessions: '\u{1F3AF}',
  average: '\u{1F4CA}',
  best: '\u{1F3C6}',
}

export default function DashboardPage() {
  const { tutorId } = useTutor()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const load = () => getDashboard(tutorId).then(setStats)
  useEffect(() => { load() }, [tutorId])

  if (!stats) return <p className="text-center text-gray-400 py-12">Loading…</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-filos-primary">Dashboard</h2>
      </div>

      {stats.total_words === 0 && (
        <div className="bg-filos-primary/5 border border-filos-primary/20 rounded-xl p-6 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-filos-primary">Your vocabulary is empty</p>
            <p className="text-sm text-gray-500 mt-0.5">Load a word package to get started quickly.</p>
          </div>
          <Link
            to={`/tutors/${tutorId}/vocabulary?mode=package`}
            className="flex-shrink-0 bg-filos-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-filos-primary-dark transition shadow-sm"
          >
            Load a Package →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={STAT_ICONS.words} label="Total Words" value={stats.total_words} />
        <StatCard icon={STAT_ICONS.sessions} label="Sessions / Questions" value={`${stats.total_sessions} / ${stats.total_questions}`} />
        <StatCard icon={STAT_ICONS.average} label="Average Score" value={`${stats.average_score}%`} />
        <StatCard icon={STAT_ICONS.best} label="Best Score" value={`${stats.best_score}%`} />
      </div>

      <StatsChart data={stats.weekly_activity} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Left column: Word Types + Recent Sessions */}
        <div className="flex flex-col gap-6">
          {Object.keys(stats.word_type_counts).length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Words by Type</h3>
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-left font-medium text-gray-500">Type</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Words</th>
                    <th className="pb-2 text-right font-medium text-gray-500">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {Object.entries(stats.word_type_counts).map(([type, count]) => (
                    <tr key={type}>
                      <td className="py-2.5 capitalize text-gray-700 font-medium">{type}</td>
                      <td className="py-2.5 text-right font-medium text-gray-700">{count}</td>
                      <td className="py-2.5 text-right text-gray-400">{Math.round(count / stats.total_words * 100)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {stats.recent_sessions.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Recent Sessions</h3>
              <div className="space-y-1.5">
                {stats.recent_sessions.map((s) => <RecentSessionRow key={s.id} s={s} />)}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Vocabulary Status + Top 10 Difficult Words */}
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm p-5">
            <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Vocabulary Status</h3>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left font-medium text-gray-500">Status</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Words</th>
                  <th className="pb-2 text-right font-medium text-gray-500">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(['new', 'struggling', 'learning', 'learned'] as const).map((cat) => (
                  <tr key={cat}>
                    <td className="py-2.5"><CategoryPill category={cat} /></td>
                    <td className="py-2.5 text-right font-medium text-gray-700">{stats.word_status[cat]}</td>
                    <td className="py-2.5 text-right text-gray-400">{stats.total_words ? Math.round(stats.word_status[cat] / stats.total_words * 100) : 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {stats.difficult_words.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="text-base font-semibold text-filos-primary mb-3 font-headline">Top 10 Difficult Words</h3>
              <div className="space-y-1.5">
                {stats.difficult_words.map((w) => (
                  <div key={w.id} className="flex items-center justify-between p-2.5 bg-filos-marble rounded-lg hover:bg-filos-surface transition">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-800 truncate block">{w.english}</span>
                      <span className="text-xs text-gray-400">{w.target_language}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{w.times_correct}/{w.times_asked}</span>
                      <span className={`font-bold text-sm ${w.success_percent >= 80 ? 'text-green-600' : w.success_percent >= 40 ? 'text-amber-500' : 'text-red-500'}`}>
                        {w.success_percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
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
          s.quiz_type === 'word' ? 'bg-filos-primary/10 text-filos-primary' : s.quiz_type === 'sentence' ? 'bg-filos-accent/10 text-filos-accent' : 'bg-green-100 text-green-600'
        }`}>
          {s.quiz_type === 'word' ? 'W' : s.quiz_type === 'sentence' ? 'S' : 'C'}
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
