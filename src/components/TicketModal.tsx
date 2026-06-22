'use client'
import { useState, useEffect } from 'react'
import { Ticket, Status, Priority, TestPhase } from '@/types'
import { useStore } from '@/lib/store'
import StatusBadge from './StatusBadge'
import PriorityBadge from './PriorityBadge'
import ChatHistory from './ChatHistory'
import { formatDate, formatDateTime, getOpenDuration } from '@/lib/utils'
import { X, Trash2, Clock, Edit2, Check, ChevronLeft } from 'lucide-react'

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
  const isQCOrAdmin = role === 'super_admin' || role === 'quality_control'
  const isContractor = role === 'contractor_pm' || role === 'contractor_employee'
  const isMyContractor = isContractor && ticket.contractor === currentUser?.contractor

  const allowedStatuses = (): Status[] => {
    if (isQCOrAdmin) return ['פתוח', 'בטיפול', 'ממתין לאישור', 'סגור']
    if (isMyContractor) return ['בטיפול', 'ממתין לאישור']
    return []
  }

  const canEditFields = role === 'super_admin'
  const canEditPriority = isQCOrAdmin || role === 'contractor_pm'
  const canEditNotes = isMyContractor || isQCOrAdmin
  const canAssign = role === 'super_admin' || (role === 'contractor_pm' && isMyContractor)
  const canDelete = role === 'super_admin'

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
            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">תיאור התקלה</label>
              {canEditFields && editMode ? (
                <textarea
                  value={form.description || ''}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              ) : (
                <p className="text-gray-800 text-sm bg-gray-50 rounded-xl p-4 leading-relaxed">{ticket.description}</p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">הערות קבלן</label>
              <NotesField
                value={ticket.notes || ''}
                canEdit={canEditNotes}
                onSave={v => updateTicket(ticket.id, { notes: v })}
              />
            </div>

            {/* Chat */}
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

function NotesField({ value, canEdit, onSave }: { value: string; canEdit: boolean; onSave: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)

  useEffect(() => { setText(value) }, [value])

  if (!canEdit) {
    return (
      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-4 min-h-[60px] leading-relaxed">
        {value || <span className="text-gray-400">אין הערות</span>}
      </p>
    )
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full text-right text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl p-4 min-h-[60px] leading-relaxed transition-colors border-2 border-dashed border-transparent hover:border-gray-300"
      >
        {value || <span className="text-gray-400 flex items-center gap-1.5"><Edit2 size={13} />לחץ להוספת הערה...</span>}
      </button>
    )
  }

  return (
    <div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={3}
        autoFocus
        className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex gap-2 mt-2">
        <button onClick={() => { onSave(text); setEditing(false) }}
          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
          שמור
        </button>
        <button onClick={() => { setText(value); setEditing(false) }}
          className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          ביטול
        </button>
      </div>
    </div>
  )
}
