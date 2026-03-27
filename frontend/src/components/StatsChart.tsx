import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { WeeklyActivity } from '../types'

interface Props {
  data: WeeklyActivity[]
}

export default function StatsChart({ data }: Props) {
  const formatted = data.map((d) => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  }))

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Weekly Activity</h3>
      {data.every((d) => d.sessions === 0) ? (
        <p className="text-gray-400 text-center py-10">No activity this week yet. Start a quiz!</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis yAxisId="left" allowDecimals={false} tick={{ fill: '#9ca3af' }} />
            <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
            />
            <Bar yAxisId="left" dataKey="sessions" fill="#0D5EAF" name="Sessions" radius={[6, 6, 0, 0]} />
            <Bar yAxisId="right" dataKey="avg_score" fill="#10b981" name="Avg Score %" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
