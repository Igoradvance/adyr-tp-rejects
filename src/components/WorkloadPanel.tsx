'use client'
import { useMemo, useState } from 'react'
import * as XLSX from 'xlsx'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import { Ticket, User } from '@/types'
import { FileSpreadsheet } from 'lucide-react'

/**
 * "Who handled what" per contractor person (PM / employee), built from the
 * status history already stored on every ticket — no extra DB data.
 *   closures   – tickets that moved to 'סגור' in the period, credited to the
 *                ticket's (current) assignee
 *   toApproval – status changes to 'ממתין לאישור' made by the person
 *   actions    – every status change made by the person
 *   openLoad   – tickets assigned to the person that are not closed (now)
 */

type Period = 'today' | 'yesterday' | '7d' | '30d' | 'custom'
type Metric = 'closures' | 'toApproval' | 'actions'
type View = 'person' | 'day'
type RoleFilter = 'all' | 'contractor_pm' | 'contractor_employee'

const METRICS: { key: Metric; label: string }[] = [
  { key: 'closures', label: 'סגירות' },
  { key: 'toApproval', label: 'הועברו לאישור' },
  { key: 'actions', label: 'כל פעולות הסטטוס' },
]
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'היום' },
  { key: 'yesterday', label: 'אתמול' },
  { key: '7d', label: '7 ימים' },
  { key: '30d', label: '30 ימים' },
  { key: 'custom', label: 'טווח' },
]
const PALETTE = ['#1B3A5C', '#2A9D8F', '#EA580C', '#7C3AED', '#0891B2', '#D97706', '#DB2777', '#059669']
const UNASSIGNED = '__none__'

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const shortDay = (key: string) => { const [, m, d] = key.split('-'); return `${Number(d)}/${Number(m)}` }

interface Row {
  id: string
  name: string
  contractor: string
  role: string
  closures: number
  toApproval: number
  actions: number
  openLoad: number
}

const ROLE_LABEL: Record<string, string> = {
  contractor_pm: 'מנהל פרויקט',
  contractor_employee: 'עובד',
}

export default function WorkloadPanel({ tickets, users, lockedContractor }: {
  tickets: Ticket[]
  users: User[]
  /** contractor users only ever see their own contractor */
  lockedContractor?: string
}) {
  const [period, setPeriod] = useState<Period>('today')
  const [from, setFrom] = useState(() => dayKey(addDays(new Date(), -6)))
  const [to, setTo] = useState(() => dayKey(new Date()))
  const [contractor, setContractor] = useState<string>(lockedContractor ?? 'all')
  const [role, setRole] = useState<RoleFilter>('all')
  const [person, setPerson] = useState<string>('all')
  const [metric, setMetric] = useState<Metric>('closures')
  const [view, setView] = useState<View>('person')

  // [start, end) of the selected period, local time
  const [rangeStart, rangeEnd] = useMemo(() => {
    const today = startOfDay(new Date())
    switch (period) {
      case 'today': return [today, addDays(today, 1)]
      case 'yesterday': return [addDays(today, -1), today]
      case '7d': return [addDays(today, -6), addDays(today, 1)]
      case '30d': return [addDays(today, -29), addDays(today, 1)]
      default: {
        const a = from ? new Date(from + 'T00:00:00') : today
        const b = to ? new Date(to + 'T00:00:00') : today
        return a <= b ? [a, addDays(b, 1)] : [b, addDays(a, 1)]
      }
    }
  }, [period, from, to])

  const people = useMemo(() => users.filter(u =>
    (u.role === 'contractor_pm' || u.role === 'contractor_employee') &&
    (contractor === 'all' || u.contractor === contractor) &&
    (role === 'all' || u.role === role)
  ), [users, contractor, role])

  const { rows, daily, dayKeys, unassignedClosures } = useMemo(() => {
    const byId = new Map<string, Row>()
    for (const u of people) {
      byId.set(u.id, { id: u.id, name: u.name, contractor: u.contractor ?? '', role: u.role, closures: 0, toApproval: 0, actions: 0, openLoad: 0 })
    }
    const inRange = (iso: string) => { const t = new Date(iso); return t >= rangeStart && t < rangeEnd }

    // per day → per person → count, for the selected metric
    const daily = new Map<string, Map<string, number>>()
    const bump = (iso: string, uid: string) => {
      const k = dayKey(new Date(iso))
      if (!daily.has(k)) daily.set(k, new Map())
      const m = daily.get(k)!
      m.set(uid, (m.get(uid) ?? 0) + 1)
    }
    let unassignedClosures = 0

    for (const t of tickets) {
      if (contractor !== 'all' && t.contractor !== contractor) continue

      if (t.status !== 'סגור' && t.assignedToId && byId.has(t.assignedToId)) byId.get(t.assignedToId)!.openLoad++

      for (const h of t.statusHistory ?? []) {
        if (!inRange(h.createdAt)) continue
        if (h.newStatus === 'סגור' && h.oldStatus !== 'סגור') {
          const r = t.assignedToId ? byId.get(t.assignedToId) : undefined
          if (r) { r.closures++; if (metric === 'closures') bump(h.createdAt, r.id) }
          else if (!t.assignedToId) { unassignedClosures++; if (metric === 'closures' && person === 'all') bump(h.createdAt, UNASSIGNED) }
        }
        const actor = byId.get(h.userId)
        if (!actor) continue
        actor.actions++
        if (metric === 'actions') bump(h.createdAt, actor.id)
        if (h.newStatus === 'ממתין לאישור') {
          actor.toApproval++
          if (metric === 'toApproval') bump(h.createdAt, actor.id)
        }
      }
    }

    let rows = Array.from(byId.values())
    if (person !== 'all') rows = rows.filter(r => r.id === person)
    rows.sort((a, b) => b[metric] - a[metric] || b.actions - a.actions || a.name.localeCompare(b.name, 'he'))

    const dayKeys: string[] = []
    for (let d = rangeStart; d < rangeEnd && dayKeys.length < 92; d = addDays(d, 1)) dayKeys.push(dayKey(d))
    return { rows, daily, dayKeys, unassignedClosures }
  }, [tickets, people, contractor, person, metric, rangeStart, rangeEnd])

  const metricLabel = METRICS.find(m => m.key === metric)!.label
  const totals = rows.reduce((s, r) => ({
    closures: s.closures + r.closures, toApproval: s.toApproval + r.toApproval, actions: s.actions + r.actions,
  }), { closures: 0, toApproval: 0, actions: 0 })

  // Chart data
  const active = rows.filter(r => r[metric] > 0)
  const top = active.slice(0, PALETTE.length - 1)
  const series = [
    ...top.map((r, i) => ({ key: r.id, name: r.name, color: PALETTE[i] })),
    ...(active.length > top.length ? [{ key: '__other__', name: 'אחרים', color: '#94A3B8' }] : []),
    ...(metric === 'closures' && person === 'all' && unassignedClosures > 0 ? [{ key: UNASSIGNED, name: 'לא משויך', color: '#CBD5E1' }] : []),
  ]
  const topIds = new Set(top.map(r => r.id))
  const rowIds = new Set(rows.map(r => r.id))
  const dayData = dayKeys.map(k => {
    const m = daily.get(k) ?? new Map<string, number>()
    const point: Record<string, string | number> = { name: shortDay(k) }
    for (const s of series) point[s.key] = 0
    m.forEach((n, uid) => {
      if (uid === UNASSIGNED) point[UNASSIGNED] = n
      else if (topIds.has(uid)) point[uid] = n
      else if (rowIds.has(uid)) point.__other__ = ((point.__other__ as number) ?? 0) + n
    })
    return point
  })
  const personData = active.map(r => ({ name: r.name, value: r[metric] }))

  const exportXlsx = () => {
    const rangeText = `${shortDay(dayKey(rangeStart))} – ${shortDay(dayKey(addDays(rangeEnd, -1)))}`
    const summary = [
      ['עובד', 'קבלן', 'תפקיד', 'סגירות', 'הועברו לאישור', 'פעולות סטטוס', 'פתוחות כרגע'],
      ...rows.map(r => [r.name, r.contractor, ROLE_LABEL[r.role] ?? r.role, r.closures, r.toApproval, r.actions, r.openLoad]),
    ]
    const perDay = [
      ['יום', ...rows.map(r => r.name)],
      ...dayKeys.map(k => [shortDay(k), ...rows.map(r => daily.get(k)?.get(r.id) ?? 0)]),
    ]
    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.aoa_to_sheet([[`ביצועים לפי עובד · ${rangeText}`], [], ...summary])
    const ws2 = XLSX.utils.aoa_to_sheet([[`${metricLabel} לפי יום · ${rangeText}`], [], ...perDay])
    ws1['!cols'] = [{ wch: 22 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 13 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'לפי עובד')
    XLSX.utils.book_append_sheet(wb, ws2, 'לפי יום')
    XLSX.writeFile(wb, `TP-Reject-Workload-${dayKey(new Date())}.xlsx`)
  }

  const pill = (on: boolean) =>
    `qt-btn px-3 py-1 text-[12px] font-bold rounded-full border-[1.5px] transition-colors ${
      on ? 'border-navy-600 bg-navy-600 text-white' : 'border-line bg-white text-ink-muted hover:border-navy-300'
    }`
  const select = 'px-2.5 py-1.5 text-[12.5px] font-semibold border-[1.5px] border-line rounded-xl bg-white text-ink focus:outline-none focus:border-navy-400'

  return (
    <section className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-black text-gray-800">מי טיפל ומה נסגר — לפי עובד</h3>
          <p className="text-xs text-gray-400 mt-0.5">מנהלי פרויקט ועובדי קבלן · סגירה נזקפת לעובד המשויך לתקלה</p>
        </div>
        <button onClick={exportXlsx} disabled={rows.length === 0}
          className="qt-btn inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-bold border-[1.5px] border-line rounded-xl text-navy-600 bg-white hover:border-navy-300 disabled:opacity-40">
          <FileSpreadsheet size={15} /> ייצוא לאקסל
        </button>
      </div>

      {/* Controls */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[12px] text-ink-muted font-semibold ml-1">תקופה:</span>
          {PERIODS.map(p => (
            <button key={p.key} className={pill(period === p.key)} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
          {period === 'custom' && (
            <span className="flex items-center gap-1.5 text-[12px] text-ink-muted">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={select} />
              עד
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className={select} />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!lockedContractor && (
            <select value={contractor} onChange={e => { setContractor(e.target.value); setPerson('all') }} className={select}>
              <option value="all">כל הקבלנים</option>
              <option value="TMT">TMT</option>
              <option value="EBS">EBS</option>
            </select>
          )}
          <select value={role} onChange={e => { setRole(e.target.value as RoleFilter); setPerson('all') }} className={select}>
            <option value="all">מנהלי פרויקט + עובדים</option>
            <option value="contractor_pm">מנהלי פרויקט</option>
            <option value="contractor_employee">עובדים</option>
          </select>
          <select value={person} onChange={e => setPerson(e.target.value)} className={select}>
            <option value="all">כל העובדים</option>
            {people.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <span className="w-px h-5 bg-line mx-1" />
          <span className="text-[12px] text-ink-muted font-semibold">מדד:</span>
          {METRICS.map(m => (
            <button key={m.key} className={pill(metric === m.key)} onClick={() => setMetric(m.key)}>{m.label}</button>
          ))}
          <span className="w-px h-5 bg-line mx-1" />
          <span className="text-[12px] text-ink-muted font-semibold">תצוגה:</span>
          <button className={pill(view === 'person')} onClick={() => setView('person')}>לפי עובד</button>
          <button className={pill(view === 'day')} onClick={() => setView('day')}>לפי יום</button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'סגירות', value: totals.closures, extra: unassignedClosures && person === 'all' ? `+${unassignedClosures} ללא שיוך` : '' },
          { label: 'הועברו לאישור', value: totals.toApproval, extra: '' },
          { label: 'פעולות סטטוס', value: totals.actions, extra: '' },
        ].map(c => (
          <div key={c.label} className="rounded-xl border-[1.5px] border-line px-4 py-3">
            <div className="text-2xl font-black text-ink tabular-nums">{c.value}</div>
            <div className="text-[12px] font-semibold text-gray-600">{c.label}</div>
            {c.extra && <div className="text-[11px] text-gray-400">{c.extra}</div>}
          </div>
        ))}
      </div>

      {/* Chart */}
      {(view === 'person' ? personData.length === 0 : series.length === 0) ? (
        <div className="text-center text-sm text-gray-400 py-10">אין {metricLabel} בתקופה שנבחרה</div>
      ) : view === 'person' ? (
        <ResponsiveContainer width="100%" height={Math.max(160, personData.length * 34 + 30)}>
          <BarChart data={personData} layout="vertical" margin={{ left: 8, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => [v, metricLabel]} />
            <Bar dataKey="value" name={metricLabel} fill="#2A9D8F" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={dayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend formatter={(v) => <span className="text-xs">{v}</span>} />
            {series.map((s, i) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} stackId="a" fill={s.color}
                radius={i === series.length - 1 ? [6, 6, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[13px] text-right">
          <thead>
            <tr className="text-[12px] text-ink-muted border-b border-line">
              <th className="py-2 px-2 font-bold">עובד</th>
              <th className="py-2 px-2 font-bold">קבלן</th>
              <th className="py-2 px-2 font-bold">תפקיד</th>
              <th className="py-2 px-2 font-bold text-center">סגירות</th>
              <th className="py-2 px-2 font-bold text-center">הועברו לאישור</th>
              <th className="py-2 px-2 font-bold text-center">פעולות סטטוס</th>
              <th className="py-2 px-2 font-bold text-center">פתוחות כרגע</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400">אין עובדים תואמים לסינון</td></tr>
            )}
            {rows.map(r => (
              <tr key={r.id} className="border-b border-line/60 hover:bg-navy-100/40 cursor-pointer"
                onClick={() => setPerson(person === r.id ? 'all' : r.id)}
                title={person === r.id ? 'הצג את כולם' : 'הצג רק את העובד הזה'}>
                <td className="py-2 px-2 font-semibold text-ink">{r.name}</td>
                <td className="py-2 px-2 text-ink-muted">{r.contractor}</td>
                <td className="py-2 px-2 text-ink-muted">{ROLE_LABEL[r.role] ?? r.role}</td>
                <td className={`py-2 px-2 text-center tabular-nums ${metric === 'closures' ? 'font-black text-ink' : ''}`}>{r.closures}</td>
                <td className={`py-2 px-2 text-center tabular-nums ${metric === 'toApproval' ? 'font-black text-ink' : ''}`}>{r.toApproval}</td>
                <td className={`py-2 px-2 text-center tabular-nums ${metric === 'actions' ? 'font-black text-ink' : ''}`}>{r.actions}</td>
                <td className="py-2 px-2 text-center tabular-nums">{r.openLoad}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
