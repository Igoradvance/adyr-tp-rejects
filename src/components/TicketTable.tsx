'use client'
import { useState, useCallback } from 'react'
import { useStore } from '@/lib/store'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import TicketModal from './TicketModal'
import { formatDate, getOpenDuration, getRowHighlight, markMessagesRead, getReadCount } from '@/lib/utils'
import { MessageSquare, Clock, ArrowUpDown } from 'lucide-react'
import { Ticket } from '@/types'

type SortKey = keyof Pick<Ticket, 'ticketNumber' | 'contractor' | 'status' | 'priority' | 'targetDate' | 'testDate' | 'openedAt' | 'updatedAt'> | 'chatCount'

const PRIORITY_ORDER = { 'גבוהה': 0, 'בינונית': 1, 'נמוכה': 2 }
const STATUS_ORDER = { 'פתוח': 0, 'בטיפול': 1, 'ממתין לאישור': 2, 'סגור': 3 }

export default function TicketTable() {
  const { filteredTickets, selectedIds, toggleSelect, selectAll, clearSelection, currentUser } = useStore()
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)
  const [sessionReadCounts, setSessionReadCounts] = useState<Record<string, number>>({})
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortAsc, setSortAsc] = useState(false)

  const handleSort = useCallback((key: SortKey) => {
    setSortKey(prev => {
      if (prev === key) { setSortAsc(a => !a); return prev }
      setSortAsc(true); return key
    })
  }, [])

  const sorted = [...filteredTickets].sort((a, b) => {
    let av: string | number = ''
    let bv: string | number = ''
    if (sortKey === 'priority') { av = PRIORITY_ORDER[a.priority]; bv = PRIORITY_ORDER[b.priority] }
    else if (sortKey === 'status') { av = STATUS_ORDER[a.status]; bv = STATUS_ORDER[b.status] }
    else if (sortKey === 'chatCount') { av = a.chatMessages.length; bv = b.chatMessages.length }
    else { av = a[sortKey] || ''; bv = b[sortKey] || '' }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sortAsc ? cmp : -cmp
  })

  const allSelected = filteredTickets.length > 0 && filteredTickets.every(t => selectedIds.includes(t.id))
  const showContractor = currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control'

  const Th = ({ label, field, className = '' }: { label: string; field?: SortKey; className?: string }) => (
    <th className={`px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${className}`}>
      {field ? (
        <button onClick={() => handleSort(field)} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
          {label}
          <ArrowUpDown size={11} className={sortKey === field ? 'text-blue-500' : 'text-gray-300'} />
        </button>
      ) : label}
    </th>
  )

  return (
    <>
      <div className="bg-white border border-t-0 border-gray-200 rounded-b-xl overflow-hidden shadow-sm">
        {sorted.length === 0 ? (
          <div className="py-20 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-600 font-semibold">לא נמצאו תקלות</p>
            <p className="text-gray-400 text-sm mt-1">נסה לשנות את הסינון או החיפוש</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => allSelected ? clearSelection() : selectAll()}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <Th label="מס׳ תיק" field="ticketNumber" />
                  {showContractor && <Th label="קבלן" field="contractor" />}
                  <Th label="סטטוס" field="status" />
                  <Th label="עדיפות" field="priority" />
                  <Th label="משוייך ל" />
                  <Th label="שלב טסט" />
                  <Th label="תאריך יעד" field="targetDate" />
                  <Th label="תאריך טסט" field="testDate" />
                  <Th label="זמן פתוח" field="openedAt" />
                  <Th label="עדכון אחרון" field="updatedAt" />
                  <Th label="הודעות" field="chatCount" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map(ticket => {
                  const highlight = getRowHighlight(ticket)
                  const selected = selectedIds.includes(ticket.id)
                  const effectiveReadCount = currentUser
                    ? (ticket.id in sessionReadCounts ? sessionReadCounts[ticket.id] : getReadCount(currentUser.id, ticket.id))
                    : 0
                  const unread = !!currentUser && ticket.chatMessages.length > effectiveReadCount

                  const handleOpen = () => {
                    if (currentUser) {
                      markMessagesRead(currentUser.id, ticket.id, ticket.chatMessages.length)
                      setSessionReadCounts(prev => ({ ...prev, [ticket.id]: ticket.chatMessages.length }))
                    }
                    setOpenTicketId(ticket.id)
                  }

                  return (
                    <tr
                      key={ticket.id}
                      onClick={handleOpen}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/30 ${unread ? 'animate-pulse-blue' : highlight} ${selected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(ticket.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-gray-800">{ticket.ticketNumber}</span>
                      </td>

                      {showContractor && (
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-lg font-bold text-xs ${
                            ticket.contractor === 'TMT' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {ticket.contractor}
                          </span>
                        </td>
                      )}

                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>

                      <td className="px-4 py-3">
                        <PriorityBadge priority={ticket.priority} />
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {ticket.assignedToName || <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.testPhase ? (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs whitespace-nowrap">
                            {ticket.testPhase}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">
                        {ticket.targetDate ? formatDate(ticket.targetDate) : <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        {ticket.testDate ? (
                          <TestDateCell dateStr={ticket.testDate} isClosed={ticket.status === 'סגור'} />
                        ) : <span className="text-gray-300">—</span>}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={11} />
                          {getOpenDuration(ticket)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(ticket.updatedAt)}
                      </td>

                      <td className="px-4 py-3">
                        {ticket.chatMessages.length > 0 ? (
                          <span className="flex items-center gap-1 text-xs font-medium text-blue-600">
                            <MessageSquare size={12} />
                            {ticket.chatMessages.length}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {selectedIds.length > 0 ? `${selectedIds.length} נבחרו · ` : ''}{sorted.length} תקלות
          </span>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 inline-block" />מתקרב לטסט (עד יומיים)</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />חרג מתאריך טסט</span>
          </div>
        </div>
      </div>

      {openTicketId && (
        <TicketModal ticketId={openTicketId} onClose={() => setOpenTicketId(null)} />
      )}
    </>
  )
}

function TestDateCell({ dateStr, isClosed }: { dateStr: string; isClosed: boolean }) {
  if (isClosed) return <span className="text-gray-500">{formatDate(dateStr)}</span>

  const testDate = new Date(dateStr)
  testDate.setHours(23, 59, 59, 0)
  const now = new Date()
  const diff = (testDate.getTime() - now.getTime()) / 86400000

  let cls = 'text-gray-600'
  if (diff < 0) cls = 'text-red-600 font-semibold'
  else if (diff <= 2) cls = 'text-amber-600 font-semibold'

  return <span className={cls}>{formatDate(dateStr)}</span>
}
