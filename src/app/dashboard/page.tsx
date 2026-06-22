'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import Header from '@/components/Header'
import { BUILD, BUILD_DATE, COPYRIGHT, VERSION } from '@/lib/version'
import Filters from '@/components/Filters'
import BulkActions from '@/components/BulkActions'
import TicketTable from '@/components/TicketTable'
import { Status } from '@/types'

type Tab = { label: string; value: Status | 'all' }
const TABS: Tab[] = [
  { label: 'הכל', value: 'all' },
  { label: 'פתוח', value: 'פתוח' },
  { label: 'בטיפול', value: 'בטיפול' },
  { label: 'ממתין לאישור', value: 'ממתין לאישור' },
  { label: 'סגור', value: 'סגור' },
]

const STATUS_COLORS: Record<string, string> = {
  'פתוח': 'border-red-400 text-red-700',
  'בטיפול': 'border-blue-400 text-blue-700',
  'ממתין לאישור': 'border-amber-400 text-amber-700',
  'סגור': 'border-green-400 text-green-700',
}

export default function DashboardPage() {
  const { currentUser, tickets, filters, setFilters, selectedIds, loading } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!currentUser) router.replace('/login')
  }, [currentUser, router])

  if (!currentUser) return null

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">טוען תקלות...</p>
      </div>
    </div>
  )

  const visibleTickets = tickets.filter(t => {
    if (currentUser.role === 'contractor_pm' || currentUser.role === 'contractor_employee') {
      return t.contractor === currentUser.contractor
    }
    return true
  })

  const countFor = (status: Status | 'all') =>
    status === 'all' ? visibleTickets.length : visibleTickets.filter(t => t.status === status).length

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-0">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {TABS.slice(1).map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilters({ status: tab.value })}
              className={`bg-white rounded-xl p-4 shadow-sm border-r-4 text-right hover:shadow-md transition-all ${
                STATUS_COLORS[tab.value as string] || 'border-gray-300 text-gray-700'
              } ${filters.status === tab.value ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
            >
              <div className="text-3xl font-black mb-0.5">{countFor(tab.value as Status)}</div>
              <div className="text-xs text-gray-500 font-medium">{tab.label}</div>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-t-xl border border-gray-200 flex overflow-x-auto">
          {TABS.map(tab => {
            const count = countFor(tab.value as Status | 'all')
            const active = filters.status === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setFilters({ status: tab.value })}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                  active ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Filters */}
        <Filters />

        {/* Bulk actions */}
        {selectedIds.length > 0 && <BulkActions />}

        {/* Table */}
        <TicketTable />
      </main>
      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 mt-6 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
        <span>{COPYRIGHT}</span>
        <span>v{VERSION} · Build {BUILD} · {BUILD_DATE}</span>
      </footer>
    </div>
  )
}
