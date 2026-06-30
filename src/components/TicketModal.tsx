'use client'
import { useState, useEffect } from 'react'
import { Ticket, Status, Priority, TestPhase } from '@/types'
import { useStore } from '@/lib/store'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import ChatHistory from './ChatHistory'
import { formatDate, formatDateTime, getOpenDuration } from '@/lib/utils'
import { X, Trash2, Clock, Edit2, Check, ChevronLeft } from 'lucide-react'
import QualityTrackerPanel from './QualityTrackerPanel'

interface Props {
  ticketId: string
  onClose: () => void
}

export default function TicketModal({ ticketId, onClose }: Props) {
  const { currentUser, updateTicket, updateStatus, deleteTicket, users, tickets } = useStore()
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<Partial<Ticket>>({})

  const ticket = tickets.find(t => t.id === ticketId)

  useEffect(() => {
    if (ticket) setForm({ ...ticket })
  }, [ticket?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!ticket) return null

  const role = currentUser?.role
  const isViewer = role === 'viewer'
  const isQCOrAdmin = role === 'super_admin' || role === 'quality_control'
  const isContractor = role === 'contractor_pm' || role === 'contractor_employee'
  const isMyContractor = isContractor && ticket.contractor === currentUser?.contractor

  const allowedStatuses = (): Status[] => {
    if (isViewer) return []
    if (isQCOrAdmin) return ['פתוח', 'בטיפול', 'ממתין לאישור', 'סגור']
    if (isMyContractor) return ['בטיפול', 'ממתין לאישור']
    return []
  }

  const canEditFields = !isViewer && isQCOrAdmin
  const canEditPriority = !isViewer && (isQCOrAdmin || role === 'contractor_pm')
  const canAssign = !isViewer && (role === 'super_admin' || (role === 'contractor_pm' && isMyContractor))
  const canDelete = !isViewer && role === 'super_admin'

  const contractorUsers = users.filter(u => u.contractor === ticket.contractor)
  const statuses = allowedStatuses()

  const save = () => {
    updateTicket(ticket.id, {
      ticketNumber: form.ticketNumber,
      description: form.description,
      priority: form.priority,
      testPhase: form.testPhase,
      targetDate: form.targetDate,
      testDate: form.testDate,
      assignedToId: form.assignedToId,
      assignedToName: users.find(u => u.id === form.assignedToId)?.name,
    })
    setEditMode(false)
  }

  const handleDelete = () => {
    if (window.confirm('האם למחוק את התקלה לצמיתות?')) {
      deleteTicket(ticket.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-6 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            {canEditFields && editMode ? (
              <input
                value={form.ticketNumber || ''}
                onChange={e => setForm(p => ({ ...p, ticketNumber: e.target.value }))}
                className="font-mono font-bold text-gray-900 text-base border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            ) : (
              <span className="font-mono font-bold text-gray-900 text-lg">{ticket.ticketNumber}</span>
            )}
            <span className={`px-2.5 py-0.5 rounded-lg font-bold text-sm flex-shrink-0 ${
              ticket.contractor === 'TMT' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
            }`}>
              {ticket.contractor}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {canEditFields && !editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                <Edit2 size={13} /> ערוך
              </button>
            )}
            {editMode && (
              <>
                <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors font-medium">
                  <Check size={13} /> שמור
                </button>
                <button onClick={() => setEditMode(false)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                  ביטול
                </button>
              </>
            )}
            {canDelete && (
              <button onClick={handleDelete} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: main content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description — QC/Admin fill, contractor reads only */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                תיאור התקלה
                {isContractor && <span className="mr-2 text-gray-300 font-normal normal-case">(בקרת איכות)</span>}
              </label>
              {canEditFields ? (
                editMode ? (
                  <textarea
                    value={form.description || ''}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <div
                    onClick={() => setEditMode(true)}
                    className="text-gray-800 text-sm bg-gray-50 hover:bg-gray-100 rounded-xl p-4 leading-relaxed cursor-pointer border-2 border-dashed border-transparent hover:border-gray-300 transition-all whitespace-pre-wrap"
                  >
                    {ticket.description || <span className="text-gray-400">לחץ להזנת תיאור התקלה...</span>}
                  </div>
                )
              ) : (
                <p className="text-gray-800 text-sm bg-blue-50 border border-blue-100 rounded-xl p-4 leading-relaxed whitespace-pre-wrap">
                  {ticket.description || <span className="text-gray-400">—</span>}
                </p>
              )}
            </div>

            {/* Chat — main communication channel */}
            <ChatHistory ticketId={ticket.id} messages={ticket.chatMessages} />

            {/* Status history */}
            {ticket.statusHistory.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">היסטוריית שינויי סטטוס</label>
                <div className="space-y-2">
                  {ticket.statusHistory.map((change, i) => (
                    <div key={change.id} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-400 w-32 flex-shrink-0">{formatDateTime(change.createdAt)}</span>
                      <span className="font-medium text-gray-700">{change.userName}</span>
                      {i > 0 && (
                        <>
                          <ChevronLeft size={12} className="text-gray-300" />
                          <StatusBadge status={change.newStatus} />
                        </>
                      )}
                      {i === 0 && <span className="text-gray-400">פתח את התקלה</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="space-y-5">
            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">סטטוס</label>
              {statuses.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map(s => (
                    <button
                      key={s}
                      onClick={() => updateStatus(ticket.id, s)}
                      className={`px-2.5 py-1.5 text-xs rounded-lg border-2 font-medium transition-all ${
                        ticket.status === s
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : (
                <StatusBadge status={ticket.status} />
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">עדיפות</label>
              {canEditPriority ? (
                <select
                  value={editMode ? form.priority || ticket.priority : ticket.priority}
                  onChange={e => {
                    const v = e.target.value as Priority
                    editMode ? setForm(p => ({ ...p, priority: v })) : updateTicket(ticket.id, { priority: v })
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="גבוהה">גבוהה</option>
                  <option value="בינונית">בינונית</option>
                  <option value="נמוכה">נמוכה</option>
                </select>
              ) : (
                <PriorityBadge priority={ticket.priority} />
              )}
            </div>

            {/* Assigned to */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">משוייך ל</label>
              {canAssign ? (
                <select
                  value={editMode ? form.assignedToId || '' : ticket.assignedToId || ''}
                  onChange={e => {
                    const uid = e.target.value
                    const name = users.find(u => u.id === uid)?.name
                    if (editMode) {
                      setForm(p => ({ ...p, assignedToId: uid, assignedToName: name }))
                    } else {
                      updateTicket(ticket.id, { assignedToId: uid, assignedToName: name })
                    }
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">לא משוייך</option>
                  {contractorUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              ) : (
                <span className="text-sm text-gray-700">{ticket.assignedToName || '—'}</span>
              )}
            </div>

            {/* Test phase */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">שלב טסט</label>
              {canEditFields && editMode ? (
                <select
                  value={form.testPhase || ''}
                  onChange={e => setForm(p => ({ ...p, testPhase: (e.target.value as TestPhase) || undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">לא צוין</option>
                  <option value="לפני טסט">לפני טסט</option>
                  <option value="אחרי טסט">אחרי טסט</option>
                </select>
              ) : ticket.testPhase ? (
                <span className="inline-flex px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium">
                  {ticket.testPhase}
                </span>
              ) : (
                <span className="text-sm text-gray-400">—</span>
              )}
            </div>

            {/* Dates */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">תאריך יעד לסיום</label>
              {canEditFields && editMode ? (
                <input type="date" value={form.targetDate || ''} onChange={e => setForm(p => ({ ...p, targetDate: e.target.value || undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <span className="text-sm text-gray-700">{ticket.targetDate ? formatDate(ticket.targetDate) : '—'}</span>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">תאריך טסט</label>
              {canEditFields && editMode ? (
                <input type="date" value={form.testDate || ''} onChange={e => setForm(p => ({ ...p, testDate: e.target.value || undefined }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              ) : (
                <span className="text-sm text-gray-700">{ticket.testDate ? formatDate(ticket.testDate) : '—'}</span>
              )}
            </div>

            {/* Quality Tracker Integration */}
            {isQCOrAdmin && (
              <QualityTrackerPanel ticketNumber={ticket.ticketNumber} />
            )}

            {/* Metadata */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <MetaRow label="נפתח ע״י" value={ticket.createdByName} />
              <MetaRow label="תאריך פתיחה" value={formatDate(ticket.openedAt)} />
              {ticket.closedAt && <MetaRow label="תאריך סגירה" value={formatDate(ticket.closedAt)} />}
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">זמן פתוח</span>
                <span className="flex items-center gap-1 text-gray-700 font-medium">
                  <Clock size={12} className="text-gray-400" />
                  {getOpenDuration(ticket)}
                </span>
              </div>
              <MetaRow label="עודכן לאחרונה" value={formatDateTime(ticket.updatedAt)} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start text-xs gap-2">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-gray-700 text-right">{value}</span>
    </div>
  )
}

