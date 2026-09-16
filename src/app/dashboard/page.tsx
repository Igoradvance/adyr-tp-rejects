'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import Header from '@/components/Header'
import Filters from '@/components/Filters'
import BulkActions from '@/components/BulkActions'
import TicketTable from '@/components/TicketTable'
import { Status } from '@/types'
import { exportToExcel } from '@/lib/exportExcel'
import { FileSpreadsheet, CircleAlert, Wrench, Hourglass, CircleCheck, Layers } from 'lucide-react'

type Tab = { label: string; value: Status | 'all'; icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>; color: string; bg: string; bar: string }
const TABS: Tab[] = [
  { label: 'הכל', value: 'all', icon: Layers, color: 'text-navy-600', bg: 'bg-navy-100', bar: 'border-navy-500' },
  { label: 'פתוח', value: 'פתוח', icon: CircleAlert, color: 'text-red-600', bg: 'bg-red-50', bar: 'border-red-400' },
  { label: 'בטיפול', value: 'בטיפול', icon: Wrench, color: 'text-navy-500', bg: 'bg-navy-100', bar: 'border-navy-400' },
  { label: 'ממתין לאישור', value: 'ממתין לאישור', icon: Hourglass, color: 'text-amber-600', bg: 'bg-amber-50', bar: 'border-amber-400' },
  { label: 'סגור', value: 'סגור', icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'border-emerald-400' },
]

export default function DashboardPage() {
  const { currentUser, authLoading, tickets, filters, setFilters, selectedIds, ticketsLoading: loading } = useStore()
  const router = useRouter()

  // Only redirect once auth has actually resolved — redirecting while the
  // session is still loading bounced users to /login and left a blank frame.
  useEffect(() => {
    if (!authLoading && !currentUser) router.replace('/login')
  }, [authLoading, currentUser, router])

  if (authLoading || (!currentUser && !authLoading) || loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-ink-muted text-sm font-semibold">{authLoading ? 'מאמת התחברות...' : 'טוען תקלות...'}</p>
      </div>
    </div>
  )
  if (!currentUser) return null

  const visibleTickets = tickets.filter(t => {
    if (currentUser.role === 'contractor_pm' || currentUser.role === 'contractor_employee') {
      return t.contractor === currentUser.contractor
    }
    return true
  })

  const countFor = (status: Status | 'all') =>
    status === 'all' ? visibleTickets.length : visibleTickets.filter(t => t.status === status).length

  return (
    <div className="min-h-screen tp-main">
      <Header />

      <main className="px-4 sm:px-6 py-5 space-y-0">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {TABS.slice(1).map(tab => {
            const Icon = tab.icon
            const active = filters.status === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setFilters({ status: active ? 'all' : tab.value })}
                className={`qt-card qt-fade-up bg-white rounded-2xl p-4 border-[1.5px] text-right flex items-center gap-3 ${
                  active ? 'border-navy-500 ring-2 ring-navy-500/15' : 'border-line'
                }`}
              >
                <span className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tab.bg} ${tab.color}`}>
                  <Icon size={22} strokeWidth={2.2} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[26px] leading-none font-black text-ink tabular-nums">{countFor(tab.value)}</span>
                  <span className="block text-[12px] text-ink-muted font-semibold mt-1 truncate">{tab.label}</span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Toolbar: tabs + export */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-1 p-1 bg-[#EEF2F7] border border-line rounded-[14px] overflow-x-auto max-w-full">
            {TABS.map(tab => {
              const count = countFor(tab.value)
              const active = filters.status === tab.value
              return (
                <button
                  key={tab.value}
                  onClick={() => setFilters({ status: tab.value })}
                  className={`qt-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13.5px] font-bold whitespace-nowrap ${
                    active ? 'bg-navy-600 text-white shadow-sm' : 'text-ink-muted hover:bg-navy-100'
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[11px] tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-white text-ink-muted border border-line'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {(currentUser.role === 'super_admin' || currentUser.role === 'quality_control') && (
            <button
              onClick={() => exportToExcel(visibleTickets, currentUser.name)}
              className="qt-btn inline-flex items-center gap-2 px-4 py-2.5 bg-white border-[1.5px] border-line text-navy-600 rounded-xl text-[13.5px] font-bold shadow-sm"
            >
              <FileSpreadsheet size={16} strokeWidth={2.2} className="text-emerald-600" />
              ייצוא לאקסל + KPI
            </button>
          )}
        </div>

        {/* Table card: filters + bulk + rows */}
        <div className="qt-fade-up bg-white border-[1.5px] border-line rounded-2xl shadow-sm overflow-hidden">
          <Filters />
          {selectedIds.length > 0 && <BulkActions />}
          <TicketTable />
        </div>
      </main>
    </div>
  )
}
