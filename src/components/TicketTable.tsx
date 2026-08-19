'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import TicketModal from './TicketModal'
import { formatDate, getOpenDuration, getRowHighlight, markMessagesRead, getReadCount } from '@/lib/utils'
import { MessageSquare, Clock, ArrowUpDown } from 'lucide-react'
import { Ticket, Status, Priority, TestPhase, SaipemStatus } from '@/types'

type SortKey = keyof Pick<Ticket, 'ticketNumber' | 'contractor' | 'status' | 'priority' | 'targetDate' | 'testDate' | 'openedAt' | 'updatedAt' | 'saipemStatus'> | 'chatCount'

const PRIORITY_ORDER = { 'גבוהה': 0, 'בינונית': 1, 'נמוכה': 2 }
const STATUS_ORDER = { 'פתוח': 0, 'בטיפול': 1, 'ממתין לאישור': 2, 'סגור': 3 }

type EditingCell = { ticketId: string; field: string }

export default function TicketTable() {
  const { filteredTickets, selectedIds, toggleSelect, selectAll, clearSelection, currentUser, updateTicket, updateStatus, users } = useStore()
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)
  const [sessionReadCounts, setSessionReadCounts] = useState<Record<string, number>>({})
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortAsc, setSortAsc] = useState(false)
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const editRef = useRef<HTMLSelectElement | HTMLInputElement | null>(null)

  // Close inline editor on outside click
  useEffect(() => {
    if (!editingCell) return
    const handler = (e: MouseEvent) => {
      if (editRef.current && !editRef.current.contains(e.target as Node)) {
        setEditingCell(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editingCell])

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

  const role = currentUser?.role
  const isQCOrAdmin = role === 'super_admin' || role === 'quality_control'
  const isContractorPm = role === 'contractor_pm'

  // Begin editing a cell — stop row click propagation
  const startEdit = (e: React.MouseEvent, ticketId: string, field: string) => {
    e.stopPropagation()
    setEditingCell({ ticketId, field })
  }

  const isEditing = (ticketId: string, field: string) =>
    editingCell?.ticketId === ticketId && editingCell?.field === field

  const Th = ({ label, field, className = '' }: { label: string; field?: SortKey; className?: string }) => (
    <th className={`px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap ${className}`}>
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
          <div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 w-10">
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
                  <Th label="סייפם" field="saipemStatus" />
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
                  const relevantMessages = isQCOrAdmin
                    ? ticket.chatMessages.filter(m => m.userRole !== 'quality_control' && m.userRole !== 'super_admin')
                    : ticket.chatMessages
                  const unread = !!currentUser && relevantMessages.length > effectiveReadCount

                  const canEditStatus = isQCOrAdmin || (isContractorPm && ticket.contractor === currentUser?.contractor)
                  const canEditPriority = isQCOrAdmin || (isContractorPm && ticket.contractor === currentUser?.contractor)
                  const canEditFields = isQCOrAdmin
                  const canAssign = isQCOrAdmin || (isContractorPm && ticket.contractor === currentUser?.contractor)
                  const contractorUsers = users.filter(u => u.contractor === ticket.contractor)

                  const statusOptions: Status[] = isQCOrAdmin
                    ? ['פתוח', 'בטיפול', 'ממתין לאישור', 'סגור']
                    : ['בטיפול', 'ממתין לאישור']

                  const handleOpen = () => {
                    if (editingCell) return
                    if (currentUser) {
                      markMessagesRead(currentUser.id, ticket.id, relevantMessages.length)
                      setSessionReadCounts(prev => ({ ...prev, [ticket.id]: relevantMessages.length }))
                    }
                    setOpenTicketId(ticket.id)
                  }

                  // Inline select component
                  const InlineSelect = ({ field, value, options, placeholder = '—', onChange }: {
                    field: string
                    value: string
                    options: { value: string; label: string }[]
                    placeholder?: string
                    onChange: (val: string) => void
                  }) => {
                    if (isEditing(ticket.id, field)) {
                      return (
                        <select
                          ref={editRef as React.RefObject<HTMLSelectElement>}
                          autoFocus
                          defaultValue={value}
                          onChange={e => { onChange(e.target.value); setEditingCell(null) }}
                          onBlur={() => setEditingCell(null)}
                          onClick={e => e.stopPropagation()}
                          className="w-full border border-blue-400 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                        >
                          <option value="">{placeholder}</option>
                          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      )
                    }
                    return null
                  }

                  // Inline date component
                  const InlineDate = ({ field, value, onChange }: {
                    field: string
                    value: string
                    onChange: (val: string) => void
                  }) => {
                    if (isEditing(ticket.id, field)) {
                      return (
                        <input
                          ref={editRef as React.RefObject<HTMLInputElement>}
                          type="date"
                          autoFocus
                          defaultValue={value}
                          onChange={e => { onChange(e.target.value); setEditingCell(null) }}
                          onBlur={() => setEditingCell(null)}
                          onClick={e => e.stopPropagation()}
                          className="border border-blue-400 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                        />
                      )
                    }
                    return null
                  }

                  return (
                    <tr
                      key={ticket.id}
                      onClick={handleOpen}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/30 ${unread ? 'animate-pulse-blue' : highlight} ${selected ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleSelect(ticket.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold text-gray-800">{ticket.ticketNumber}</span>
                      </td>

                      {showContractor && (
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-lg font-bold text-xs ${
                            ticket.contractor === 'TMT' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
                          }`}>
                            {ticket.contractor}
                          </span>
                        </td>
                      )}

                      {/* Status — inline editable */}
                      <td className="px-3 py-2" onClick={e => canEditStatus ? startEdit(e, ticket.id, 'status') : undefined}>
                        {isEditing(ticket.id, 'status') ? (
                          <InlineSelect
                            field="status"
                            value={ticket.status}
                            options={statusOptions.map(s => ({ value: s, label: s }))}
                            placeholder={ticket.status}
                            onChange={val => val && updateStatus(ticket.id, val as Status)}
                          />
                        ) : (
                          <div className={canEditStatus ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}>
                            <StatusBadge status={ticket.status} />
                          </div>
                        )}
                      </td>

                      {/* Priority — inline editable */}
                      <td className="px-3 py-2" onClick={e => canEditPriority ? startEdit(e, ticket.id, 'priority') : undefined}>
                        {isEditing(ticket.id, 'priority') ? (
                          <InlineSelect
                            field="priority"
                            value={ticket.priority}
                            options={[
                              { value: 'גבוהה', label: 'גבוהה' },
                              { value: 'בינונית', label: 'בינונית' },
                              { value: 'נמוכה', label: 'נמוכה' },
                            ]}
                            onChange={val => val && updateTicket(ticket.id, { priority: val as Priority })}
                          />
                        ) : (
                          <div className={canEditPriority ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}>
                            <PriorityBadge priority={ticket.priority} />
                          </div>
                        )}
                      </td>

                      {/* Assigned to — inline editable */}
                      <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap" onClick={e => canAssign ? startEdit(e, ticket.id, 'assignedTo') : undefined}>
                        {isEditing(ticket.id, 'assignedTo') ? (
                          <InlineSelect
                            field="assignedTo"
                            value={ticket.assignedToId || ''}
                            options={contractorUsers.map(u => ({ value: u.id, label: u.name }))}
                            placeholder="לא משוייך"
                            onChange={uid => {
                              const name = users.find(u => u.id === uid)?.name
                              updateTicket(ticket.id, { assignedToId: uid || undefined, assignedToName: name })
                            }}
                          />
                        ) : (
                          <span className={canAssign ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}>
                            {ticket.assignedToName || <span className="text-gray-300">—</span>}
                          </span>
                        )}
                      </td>

                      {/* Test phase — inline editable */}
                      <td className="px-3 py-2" onClick={e => canEditFields ? startEdit(e, ticket.id, 'testPhase') : undefined}>
                        {isEditing(ticket.id, 'testPhase') ? (
                          <InlineSelect
                            field="testPhase"
                            value={ticket.testPhase || ''}
                            options={[
                              { value: 'לפני טסט', label: 'לפני טסט' },
                              { value: 'אחרי טסט', label: 'אחרי טסט' },
                            ]}
                            placeholder="לא צוין"
                            onChange={val => updateTicket(ticket.id, { testPhase: (val as TestPhase) || undefined })}
                          />
                        ) : ticket.testPhase ? (
                          <span className={`px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs whitespace-nowrap ${canEditFields ? 'cursor-pointer hover:opacity-80' : ''}`}>
                            {ticket.testPhase}
                          </span>
                        ) : (
                          <span className={`text-gray-300 ${canEditFields ? 'cursor-pointer hover:text-gray-500' : ''}`}>—</span>
                        )}
                      </td>

                      {/* SAIPEM — inline editable */}
                      <td className="px-3 py-2" onClick={e => canEditFields ? startEdit(e, ticket.id, 'saipemStatus') : undefined}>
                        {isEditing(ticket.id, 'saipemStatus') ? (
                          <InlineSelect
                            field="saipemStatus"
                            value={ticket.saipemStatus || ''}
                            options={[
                              { value: 'לפני סייפם', label: 'לפני סייפם' },
                              { value: 'אחרי סייפם', label: 'אחרי סייפם' },
                            ]}
                            placeholder="לא צוין"
                            onChange={val => updateTicket(ticket.id, { saipemStatus: (val as SaipemStatus) || undefined })}
                          />
                        ) : ticket.saipemStatus ? (
                          <span className={`px-2 py-0.5 rounded text-xs whitespace-nowrap font-medium ${
                            ticket.saipemStatus === 'אחרי סייפם' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                          } ${canEditFields ? 'cursor-pointer hover:opacity-80' : ''}`}>
                            {ticket.saipemStatus}
                          </span>
                        ) : (
                          <span className={`text-gray-300 ${canEditFields ? 'cursor-pointer hover:text-gray-500' : ''}`}>—</span>
                        )}
                      </td>

                      {/* Target date — inline editable */}
                      <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap" onClick={e => canEditFields ? startEdit(e, ticket.id, 'targetDate') : undefined}>
                        {isEditing(ticket.id, 'targetDate') ? (
                          <InlineDate
                            field="targetDate"
                            value={ticket.targetDate || ''}
                            onChange={val => updateTicket(ticket.id, { targetDate: val || undefined })}
                          />
                        ) : ticket.targetDate ? (
                          <span className={canEditFields ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}>
                            {formatDate(ticket.targetDate)}
                          </span>
                        ) : (
                          <span className={`text-gray-300 ${canEditFields ? 'cursor-pointer hover:text-gray-500' : ''}`}>—</span>
                        )}
                      </td>

                      {/* Test date — inline editable */}
                      <td className="px-3 py-2 text-xs whitespace-nowrap" onClick={e => canEditFields ? startEdit(e, ticket.id, 'testDate') : undefined}>
                        {isEditing(ticket.id, 'testDate') ? (
                          <InlineDate
                            field="testDate"
                            value={ticket.testDate || ''}
                            onChange={val => updateTicket(ticket.id, { testDate: val || undefined })}
                          />
                        ) : ticket.testDate ? (
                          <span className={canEditFields ? 'cursor-pointer hover:text-blue-600 transition-colors' : ''}>
                            <TestDateCell dateStr={ticket.testDate} isClosed={ticket.status === 'סגור'} />
                          </span>
                        ) : (
                          <span className={`text-gray-300 ${canEditFields ? 'cursor-pointer hover:text-gray-500' : ''}`}>—</span>
                        )}
                      </td>

                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={11} />
                          {getOpenDuration(ticket)}
                        </span>
                      </td>

                      <td className="px-3 py-2 text-xs text-gray-400 whitespace-nowrap">
                        {formatDate(ticket.updatedAt)}
                      </td>

                      <td className="px-3 py-2">
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
