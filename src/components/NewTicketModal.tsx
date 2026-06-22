'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Contractor, Priority, TestPhase } from '@/types'
import { X } from 'lucide-react'

const TICKET_PATTERN = /^TP-\d{2}-\d{3}-P-\d{3}-\d{3}$/

export default function NewTicketModal({ onClose }: { onClose: () => void }) {
  const { createTicket, users } = useStore()
  const [form, setForm] = useState({
    ticketNumber: '',
    contractor: 'TMT' as Contractor,
    description: '',
    priority: 'בינונית' as Priority,
    testPhase: '' as TestPhase | '',
    targetDate: '',
    testDate: '',
    assignedToId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.ticketNumber.trim()) e.ticketNumber = 'שדה חובה'
    else if (!TICKET_PATTERN.test(form.ticketNumber.trim())) e.ticketNumber = 'פורמט נדרש: TP-xx-xxx-P-xxx-xxx'
    if (!form.description.trim()) e.description = 'שדה חובה'
    return e
  }

  const submit = () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    const assignedUser = users.find(u => u.id === form.assignedToId)
    createTicket({
      ticketNumber: form.ticketNumber.trim(),
      contractor: form.contractor,
      description: form.description.trim(),
      priority: form.priority,
      testPhase: form.testPhase || undefined,
      targetDate: form.targetDate || undefined,
      testDate: form.testDate || undefined,
      assignedToId: form.assignedToId || undefined,
      assignedToName: assignedUser?.name,
    })
    onClose()
  }

  const contractorUsers = users.filter(u => u.contractor === form.contractor)

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">פתיחת תקלה חדשה</h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Ticket number */}
          <Field label="מספר תיק" required error={errors.ticketNumber}>
            <input
              type="text"
              value={form.ticketNumber}
              onChange={e => setForm(p => ({ ...p, ticketNumber: e.target.value }))}
              placeholder="TP-01-001-P-001-001"
              className={inputCls(!!errors.ticketNumber) + ' font-mono'}
            />
          </Field>

          {/* Contractor */}
          <Field label="קבלן">
            <div className="grid grid-cols-2 gap-2">
              {(['TMT', 'EBS'] as Contractor[]).map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, contractor: c, assignedToId: '' }))}
                  className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                    form.contractor === c
                      ? c === 'TMT'
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-cyan-400 bg-cyan-50 text-cyan-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </Field>

          {/* Description */}
          <Field label="תיאור התקלה" required error={errors.description}>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              placeholder="תאר את התקלה בפירוט..."
              className={inputCls(!!errors.description) + ' resize-none'}
            />
          </Field>

          {/* Priority */}
          <Field label="עדיפות">
            <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Priority }))}
              className={inputCls(false)}>
              <option value="גבוהה">גבוהה</option>
              <option value="בינונית">בינונית</option>
              <option value="נמוכה">נמוכה</option>
            </select>
          </Field>

          {/* Assigned to */}
          <Field label="משוייך ל">
            <select value={form.assignedToId} onChange={e => setForm(p => ({ ...p, assignedToId: e.target.value }))}
              className={inputCls(false)}>
              <option value="">לא משוייך</option>
              {contractorUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </Field>

          {/* Test phase */}
          <Field label="שלב טסט (לא חובה)">
            <select value={form.testPhase} onChange={e => setForm(p => ({ ...p, testPhase: e.target.value as TestPhase | '' }))}
              className={inputCls(false)}>
              <option value="">לא צוין</option>
              <option value="לפני טסט">לפני טסט</option>
              <option value="אחרי טסט">אחרי טסט</option>
            </select>
          </Field>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="תאריך יעד (לא חובה)">
              <input type="date" value={form.targetDate} onChange={e => setForm(p => ({ ...p, targetDate: e.target.value }))}
                className={inputCls(false)} />
            </Field>
            <Field label="תאריך טסט (לא חובה)">
              <input type="date" value={form.testDate} onChange={e => setForm(p => ({ ...p, testDate: e.target.value }))}
                className={inputCls(false)} />
            </Field>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-200">
          <button onClick={submit}
            className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm">
            פתח תקלה
          </button>
          <button onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function inputCls(hasError: boolean) {
  return `w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
    hasError ? 'border-red-300 focus:ring-red-400' : 'border-gray-300'
  }`
}
