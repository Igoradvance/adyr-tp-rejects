'use client'
import { useState, useCallback, useRef, useEffect } from 'react'
import { useStore } from '@/lib/store'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import TicketModal from './TicketModal'
import { formatDate, getOpenDuration, getRowHighlight, markMessagesRead, getReadCount } from '@/lib/utils'
import { MessageSquareText, Clock, ArrowUpDown, Hourglass, Flag, ShieldCheck, SearchX } from 'lucide-react'
import { Ticket, Status, Priority, TestPhase, SaipemStatus } from '@/types'

type SortKey = keyof Pick<Ticket, 'ticketNumber' | 'contractor' | 'status' | 'priority' | 'targetDate' | 'testDate' | 'openedAt' | 'updatedAt' | 'saipemStatus'> | 'chatCount'

const PRIORITY_ORDER = { 'גבוהה': 0, 'בינונית': 1, 'נמוכה': 2 }
const STATUS_ORDER = { 'פתוח': 0, 'בטיפול': 1, 'ממתין לאישור': 2, 'סגור': 3 }

type EditingCell = { ticketId: string; field: string }

const inlineCls = 'w-full border-[1.5px] border-teal-500 rounded-lg px-2 py-1 text-xs bg-white shadow-sm'
const dash = <span className="text-ink-faint/60">—</span>

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
      if (editRef.current && !editRef.current.contains(e.target as Node)) setEditingCell(null)
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

  const startEdit = (e: React.MouseEvent, ticketId: string, field: string) => {
    e.stopPropagation()
    setEditingCell({ ticketId, field })
  }
  const isEditing = (ticketId: string, field: string) =>
    editingCell?.ticketId === ticketId && editingCell?.field === field

  const Th = ({ label, field, className = '' }: { label: string; field?: SortKey; className?: string }) => (
    <th className={`px-3 py-3 text-right text-[11px] font-extrabold text-ink-muted tracking-wide whitespace-nowrap ${className}`}>
      {field ? (
        <button onClick={() => handleSort(field)} className="inline-flex items-center gap-1 hover:text-ink transition-colors">
          {label}
          <ArrowUpDown size={11} className={sortKey === field ? 'text-teal-600' : 'text-ink-faint/50'} />
        </button>
      ) : label}
    </th>
  )

  const editable = (can: boolean) => can ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''

  return (
    <>
      {sorted.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center gap-3 text-ink-faint">
          <span className="w-14 h-14 rounded-2xl bg-[#EEF2F7] flex items-center justify-center">
            <SearchX size={26} strokeWidth={1.8} />
          </span>
          <p className="text-ink font-bold">לא נמצאו תקלות</p>
          <p className="text-sm">נסה לשנות את הסינון או החיפוש</p>
        </div>
      ) : (
        <div>
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFD] border-b border-line">
              <tr>
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => allSelected ? clearSelection() : selectAll()}
                    className="rounded border-line text-navy-600 accent-navy-600"
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
            <tbody className="divide-y divide-line">
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

                const mine = isContractorPm && ticket.contractor === currentUser?.contractor
                const canEditStatus = isQCOrAdmin || mine
                const canEditPriority = isQCOrAdmin || mine
                const canEditFields = isQCOrAdmin
                const canAssign = isQCOrAdmin || mine
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

                const InlineSelect = ({ value, options, placeholder = '—', onChange }: {
                  value: string
                  options: { value: string; label: string }[]
                  placeholder?: string
                  onChange: (val: string) => void
                }) => (
                  <select
                    ref={editRef as React.RefObject<HTMLSelectElement>}
                    autoFocus
                    defaultValue={value}
                    onChange={e => { onChange(e.target.value); setEditingCell(null) }}
                    onBlur={() => setEditingCell(null)}
                    onClick={e => e.stopPropagation()}
                    className={inlineCls}
                  >
                    <option value="">{placeholder}</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )

                const InlineDate = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
                  <input
                    ref={editRef as React.RefObject<HTMLInputElement>}
                    type="date"
                    autoFocus
                    defaultValue={value}
                    onChange={e => { onChange(e.target.value); setEditingCell(null) }}
                    onBlur={() => setEditingCell(null)}
                    onClick={e => e.stopPropagation()}
                    className={inlineCls}
                  />
                )

                return (
                  <tr
                    key={ticket.id}
                    onClick={handleOpen}
                    className={`cursor-pointer transition-colors hover:bg-navy-50 ${unread ? 'animate-pulse-blue' : highlight} ${selected ? 'bg-navy-100/60' : ''}`}
                  >
                    <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleSelect(ticket.id)}
                        className="rounded border-line accent-navy-600"
                      />
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="tp-num text-[13px] text-ink">{ticket.ticketNumber}</span>
                    </td>

                    {showContractor && (
                      <td className="px-3 py-2.5">
                        <span className={`px-2.5 py-[3px] rounded-full font-extrabold text-[11px] ${
                          ticket.contractor === 'TMT' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
                        }`}>
                          {ticket.contractor}
                        </span>
                      </td>
                    )}

                    {/* Status — inline editable */}
                    <td className="px-3 py-2.5" onClick={e => canEditStatus ? startEdit(e, ticket.id, 'status') : undefined}>
                      {isEditing(ticket.id, 'status') ? (
                        <InlineSelect
                          value={ticket.status}
                          options={statusOptions.map(s => ({ value: s, label: s }))}
                          placeholder={ticket.status}
                          onChange={val => val && updateStatus(ticket.id, val as Status)}
                        />
                      ) : (
                        <div className={editable(canEditStatus)}><StatusBadge status={ticket.status} /></div>
                      )}
                    </td>

                    {/* Priority — inline editable */}
                    <td className="px-3 py-2.5" onClick={e => canEditPriority ? startEdit(e, ticket.id, 'priority') : undefined}>
                      {isEditing(ticket.id, 'priority') ? (
                        <InlineSelect
                          value={ticket.priority}
                          options={[
                            { value: 'גבוהה', label: 'גבוהה' },
                            { value: 'בינונית', label: 'בינונית' },
                            { value: 'נמוכה', label: 'נמוכה' },
                          ]}
                          onChange={val => val && updateTicket(ticket.id, { priority: val as Priority })}
                        />
                      ) : (
                        <div className={editable(canEditPriority)}><PriorityBadge priority={ticket.priority} /></div>
                      )}
                    </td>

                    {/* Assigned to — inline editable */}
                    <td className="px-3 py-2.5 text-[12.5px] text-ink-muted font-semibold whitespace-nowrap" onClick={e => canAssign ? startEdit(e, ticket.id, 'assignedTo') : undefined}>
                      {isEditing(ticket.id, 'assignedTo') ? (
                        <InlineSelect
                          value={ticket.assignedToId || ''}
                          options={contractorUsers.map(u => ({ value: u.id, label: u.name }))}
                          placeholder="לא משוייך"
                          onChange={uid => {
                            const name = users.find(u => u.id === uid)?.name
                            updateTicket(ticket.id, { assignedToId: uid || undefined, assignedToName: name })
                          }}
                        />
                      ) : (
                        <span className={canAssign ? 'cursor-pointer hover:text-navy-500 transition-colors' : ''}>
                          {ticket.assignedToName || dash}
                        </span>
                      )}
                    </td>

                    {/* Test phase — inline editable */}
                    <td className="px-3 py-2.5" onClick={e => canEditFields ? startEdit(e, ticket.id, 'testPhase') : undefined}>
                      {isEditing(ticket.id, 'testPhase') ? (
                        <InlineSelect
                          value={ticket.testPhase || ''}
                          options={[
                            { value: 'לפני טסט', label: 'לפני טסט' },
                            { value: 'אחרי טסט', label: 'אחרי טסט' },
                          ]}
                          placeholder="לא צוין"
                          onChange={val => updateTicket(ticket.id, { testPhase: (val as TestPhase) || undefined })}
                        />
                      ) : ticket.testPhase ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] bg-violet-50 text-violet-700 rounded-full text-[11.5px] font-bold whitespace-nowrap ${editable(canEditFields)}`}>
                          {ticket.testPhase === 'אחרי טסט' ? <Flag size={11} strokeWidth={2.6} /> : <Hourglass size={11} strokeWidth={2.6} />}
                          {ticket.testPhase}
                        </span>
                      ) : (
                        <span className={canEditFields ? 'cursor-pointer' : ''}>{dash}</span>
                      )}
                    </td>

                    {/* SAIPEM — inline editable */}
                    <td className="px-3 py-2.5" onClick={e => canEditFields ? startEdit(e, ticket.id, 'saipemStatus') : undefined}>
                      {isEditing(ticket.id, 'saipemStatus') ? (
                        <InlineSelect
                          value={ticket.saipemStatus || ''}
                          options={[
                            { value: 'לפני סייפם', label: 'לפני סייפם' },
                            { value: 'אחרי סייפם', label: 'אחרי סייפם' },
                          ]}
                          placeholder="לא צוין"
                          onChange={val => updateTicket(ticket.id, { saipemStatus: (val as SaipemStatus) || undefined })}
                        />
                      ) : ticket.saipemStatus ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-bold whitespace-nowrap ${
                          ticket.saipemStatus === 'אחרי סייפם' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        } ${editable(canEditFields)}`}>
                          {ticket.saipemStatus === 'אחרי סייפם' ? <ShieldCheck size={11} strokeWidth={2.6} /> : <Clock size={11} strokeWidth={2.6} />}
                          {ticket.saipemStatus}
                        </span>
                      ) : (
                        <span className={canEditFields ? 'cursor-pointer' : ''}>{dash}</span>
                      )}
                    </td>

                    {/* Target date — inline editable */}
                    <td className="px-3 py-2.5 text-[12.5px] text-ink-muted whitespace-nowrap tabular-nums" onClick={e => canEditFields ? startEdit(e, ticket.id, 'targetDate') : undefined}>
                      {isEditing(ticket.id, 'targetDate') ? (
                        <InlineDate value={ticket.targetDate || ''} onChange={val => updateTicket(ticket.id, { targetDate: val || undefined })} />
                      ) : ticket.targetDate ? (
                        <span className={canEditFields ? 'cursor-pointer hover:text-navy-500 transition-colors' : ''}>{formatDate(ticket.targetDate)}</span>
                      ) : (
                        <span className={canEditFields ? 'cursor-pointer' : ''}>{dash}</span>
                      )}
                    </td>

                    {/* Test date — inline editable */}
                    <td className="px-3 py-2.5 text-[12.5px] whitespace-nowrap tabular-nums" onClick={e => canEditFields ? startEdit(e, ticket.id, 'testDate') : undefined}>
                      {isEditing(ticket.id, 'testDate') ? (
                        <InlineDate value={ticket.testDate || ''} onChange={val => updateTicket(ticket.id, { testDate: val || undefined })} />
                      ) : ticket.testDate ? (
                        <span className={canEditFields ? 'cursor-pointer' : ''}>
                          <TestDateCell dateStr={ticket.testDate} isClosed={ticket.status === 'סגור'} />
                        </span>
                      ) : (
                        <span className={canEditFields ? 'cursor-pointer' : ''}>{dash}</span>
                      )}
                    </td>

                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[12px] text-ink-muted font-semibold tabular-nums">
                        <Clock size={11} strokeWidth={2.4} />
                        {getOpenDuration(ticket)}
                      </span>
                    </td>

                    <td className="px-3 py-2.5 text-[12px] text-ink-faint whitespace-nowrap tabular-nums">
                      {formatDate(ticket.updatedAt)}
                    </td>

                    <td className="px-3 py-2.5">
                      {ticket.chatMessages.length > 0 ? (
                        <span className={`inline-flex items-center gap-1 px-2 py-[3px] rounded-full text-[11.5px] font-bold tabular-nums ${
                          unread ? 'bg-teal-100 text-teal-700' : 'bg-navy-100 text-navy-600'
                        }`}>
                          <MessageSquareText size={12} strokeWidth={2.4} />
                          {ticket.chatMessages.length}
                        </span>
                      ) : dash}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-2 border-t border-line bg-[#F8FAFD] flex justify-between items-center flex-wrap gap-2">
        <span className="text-[12px] text-ink-muted font-semibold tabular-nums">
          {selectedIds.length > 0 ? `${selectedIds.length} נבחרו · ` : ''}{sorted.length} תקלות
        </span>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-faint font-semibold">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />מתקרב לטסט (עד יומיים)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-300 inline-block" />חרג מתאריך טסט</span>
        </div>
      </div>

      {openTicketId && (
        <TicketModal ticketId={openTicketId} onClose={() => setOpenTicketId(null)} />
      )}
    </>
  )
}

function TestDateCell({ dateStr, isClosed }: { dateStr: string; isClosed: boolean }) {
  if (isClosed) return <span className="text-ink-muted">{formatDate(dateStr)}</span>

  const testDate = new Date(dateStr)
  testDate.setHours(23, 59, 59, 0)
  const now = new Date()
  const diff = (testDate.getTime() - now.getTime()) / 86400000

  let cls = 'text-ink-muted'
  if (diff < 0) cls = 'text-red-600 font-bold'
  else if (diff <= 2) cls = 'text-amber-600 font-bold'

  return <span className={cls}>{formatDate(dateStr)}</span>
}
