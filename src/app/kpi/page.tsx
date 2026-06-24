'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import Header from '@/components/Header'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  'פתוח': '#ef4444',
  'בטיפול': '#3b82f6',
  'ממתין לאישור': '#f59e0b',
  'סגור': '#22c55e',
}
const CONTRACTOR_COLORS = { TMT: '#f97316', EBS: '#06b6d4' }
const PRIORITY_COLORS: Record<string, string> = { 'גבוהה': '#ef4444', 'בינונית': '#f59e0b', 'נמוכה': '#22c55e' }

function openDays(ticket: { openedAt: string; closedAt?: string; status: string }) {
  const start = new Date(ticket.openedAt)
  const end = ticket.status === 'סגור' && ticket.closedAt ? new Date(ticket.closedAt) : new Date()
  return Math.floor((end.getTime() - start.getTime()) / 86400000)
}

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border-r-4 ${color}`}>
      <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
      <div className="text-sm font-semibold text-gray-700">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-lg text-sm text-right">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-gray-600">{p.name ?? ''}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

export default function KPIPage() {
  const { currentUser, tickets } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) router.replace('/login')
  }, [currentUser, router])

  if (!currentUser) return null

  const visible = tickets.filter(t => {
    if (currentUser.role === 'contractor_pm' || currentUser.role === 'contractor_employee') {
      return t.contractor === currentUser.contractor
    }
    return true
  })

  const total = visible.length
  const byStatus = ['פתוח', 'בטיפול', 'ממתין לאישור', 'סגור'].map(s => ({
    name: s, value: visible.filter(t => t.status === s).length,
  }))
  const byContractor = ['TMT', 'EBS'].map(c => ({
    name: c, value: visible.filter(t => t.contractor === c).length,
  }))
  const byPriority = ['גבוהה', 'בינונית', 'נמוכה'].map(p => ({
    name: p, value: visible.filter(t => t.priority === p).length,
  }))

  const open = visible.filter(t => t.status !== 'סגור')
  const closed = visible.filter(t => t.status === 'סגור')
  const avgOpenDays = open.length ? Math.round(open.reduce((s, t) => s + openDays(t), 0) / open.length) : 0
  const avgCloseDays = closed.length ? Math.round(closed.reduce((s, t) => s + openDays(t), 0) / closed.length) : 0
  const closeRate = total ? Math.round((closed.length / total) * 100) : 0
  const withChat = visible.filter(t => t.chatMessages.length > 0).length

  // Tickets by month
  const monthMap: Record<string, number> = {}
  visible.forEach(t => {
    const d = new Date(t.openedAt)
    const key = `${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`
    monthMap[key] = (monthMap[key] || 0) + 1
  })
  const byMonth = Object.entries(monthMap)
    .sort(([a], [b]) => {
      const [am, ay] = a.split('/').map(Number)
      const [bm, by_] = b.split('/').map(Number)
      return ay !== by_ ? ay - by_ : am - bm
    })
    .map(([name, value]) => ({ name, value }))

  // Top contractors by open tickets
  const contractorOpen = ['TMT', 'EBS'].map(c => ({
    name: c,
    פתוח: visible.filter(t => t.contractor === c && t.status === 'פתוח').length,
    בטיפול: visible.filter(t => t.contractor === c && t.status === 'בטיפול').length,
    'ממתין לאישור': visible.filter(t => t.contractor === c && t.status === 'ממתין לאישור').length,
    סגור: visible.filter(t => t.contractor === c && t.status === 'סגור').length,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Title + back */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">דשבורד KPI</h1>
            <p className="text-sm text-gray-400 mt-0.5">סיכום מצב תקלות בזמן אמת</p>
          </div>
          <button onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
            ← חזור לטבלה
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          <KPICard label="סה״כ תקלות" value={total} color="border-gray-400" />
          <KPICard label="שיעור סגירה" value={`${closeRate}%`} sub={`${closed.length} סגורות`} color="border-green-400" />
          <KPICard label="ממוצע ימים פתוח" value={avgOpenDays} sub="תקלות פעילות" color="border-blue-400" />
          <KPICard label="ממוצע ימים לסגירה" value={avgCloseDays} sub="תקלות שנסגרו" color="border-purple-400" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="פתוח" value={byStatus[0].value} color="border-red-400" />
          <KPICard label="בטיפול" value={byStatus[1].value} color="border-blue-400" />
          <KPICard label="ממתין לאישור" value={byStatus[2].value} color="border-amber-400" />
          <KPICard label="עם תכתובת" value={withChat} sub={`מתוך ${total}`} color="border-indigo-400" />
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Status pie */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4 text-right">סטטוס תקלות</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {byStatus.map(entry => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {byStatus.map(s => (
                <span key={s.name} className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: STATUS_COLORS[s.name] }} />
                  {s.name} ({s.value})
                </span>
              ))}
            </div>
          </div>

          {/* Contractor pie */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4 text-right">תקלות לפי קבלן</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={byContractor} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                  label={({ name, value, percent }) => `${name}: ${value} (${Math.round(percent * 100)}%)`} labelLine={false}>
                  {byContractor.map(entry => (
                    <Cell key={entry.name} fill={CONTRACTOR_COLORS[entry.name as 'TMT' | 'EBS']} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-2">
              {byContractor.map(c => (
                <span key={c.name} className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: CONTRACTOR_COLORS[c.name as 'TMT' | 'EBS'] }} />
                  {c.name} ({c.value})
                </span>
              ))}
            </div>
          </div>

          {/* Priority bar */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4 text-right">עדיפות</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byPriority} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="כמות" radius={[0, 6, 6, 0]}>
                  {byPriority.map(entry => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* By month */}
          {byMonth.length > 1 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 mb-4 text-right">פתיחת תקלות לפי חודש</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="value" name="תקלות" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Contractor stacked */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-4 text-right">סטטוס לפי קבלן</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={contractorOpen}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
                <Bar dataKey="פתוח" stackId="a" fill="#ef4444" />
                <Bar dataKey="בטיפול" stackId="a" fill="#3b82f6" />
                <Bar dataKey="ממתין לאישור" stackId="a" fill="#f59e0b" />
                <Bar dataKey="סגור" stackId="a" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  )
}
