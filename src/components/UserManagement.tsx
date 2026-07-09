'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { UserRole, Contractor, User } from '@/types'
import { X, Plus, Trash2, Users, Bell, BellOff } from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'סופר אדמין',
  quality_control: 'בקרת איכות',
  contractor_pm: 'מנהל פרוייקט קבלן',
  contractor_employee: 'עובד קבלן',
  viewer: 'צפייה בלבד',
}

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  quality_control: 'bg-green-100 text-green-700',
  contractor_pm: 'bg-blue-100 text-blue-700',
  contractor_employee: 'bg-gray-100 text-gray-600',
  viewer: 'bg-yellow-100 text-yellow-700',
}

const ROLES_NEEDING_CONTRACTOR: UserRole[] = ['contractor_pm', 'contractor_employee']

export default function UserManagement({ onClose }: { onClose: () => void }) {
  const { users, refreshUsers, currentUser } = useStore()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'contractor_employee' as UserRole, contractor: '' as Contractor | '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { refreshUsers() }, [refreshUsers])

  const needsContractor = ROLES_NEEDING_CONTRACTOR.includes(form.role)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (needsContractor && !form.contractor) { setError('יש לבחור קבלן'); return }
    setLoading(true)

    const res = await fetch('/api/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        contractor: needsContractor ? form.contractor : null,
      }),
    })
    const json = await res.json()
    setLoading(false)

    if (json.error) { setError(json.error); return }

    await refreshUsers()
    setShowForm(false)
    setForm({ name: '', email: '', password: '', role: 'contractor_employee', contractor: '' })
  }

  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [notifError, setNotifError] = useState('')
  const toggleEmailNotif = async (user: User) => {
    setTogglingId(user.id)
    setNotifError('')
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, emailNotifications: !user.emailNotifications }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json.error) {
        setNotifError(`שמירה נכשלה (${res.status}): ${json.error || 'שגיאה לא ידועה'}`)
      } else {
        await refreshUsers()
      }
    } catch (e) {
      setNotifError('שגיאת רשת: ' + (e instanceof Error ? e.message : 'שגיאה'))
    }
    setTogglingId(null)
  }

  const handleDelete = async (user: User) => {
    const res = await fetch('/api/users/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    })
    const json = await res.json()
    if (!json.error) {
      await refreshUsers()
      setDeleteConfirm(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-6 shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">ניהול משתמשים</h2>
            <span className="text-sm text-gray-400">({users.length})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowForm(true); setError('') }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> משתמש חדש
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="p-6 border-b border-gray-100 bg-blue-50/30">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">יצירת משתמש חדש</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">שם מלא</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  required placeholder="ישראל ישראלי"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">אימייל</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  required placeholder="user@example.com" dir="ltr"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">סיסמה</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  required placeholder="לפחות 6 תווים" dir="ltr"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">תפקיד</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as UserRole, contractor: '' }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {Object.entries(ROLE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              {needsContractor && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">קבלן</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['TMT', 'EBS'] as Contractor[]).map(c => (
                      <button key={c} type="button"
                        onClick={() => setForm(p => ({ ...p, contractor: c }))}
                        className={`py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                          form.contractor === c
                            ? c === 'TMT' ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-cyan-400 bg-cyan-50 text-cyan-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {error && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <div className="flex gap-2 mt-4">
              <button type="submit" disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? 'יוצר...' : 'צור משתמש'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                ביטול
              </button>
            </div>
          </form>
        )}

        {notifError && (
          <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg break-all">
            {notifError}
          </div>
        )}

        {/* Users list */}
        <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
          {users.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-8">אין משתמשים עדיין</p>
          ) : (
            users.map(user => (
              <div key={user.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {user.name}
                      {user.id === currentUser?.id && <span className="text-xs text-gray-400 font-normal mr-2">(אתה)</span>}
                    </p>
                    <p className="text-xs text-gray-400" dir="ltr">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  {user.contractor && (
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                      user.contractor === 'TMT' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
                    }`}>
                      {user.contractor}
                    </span>
                  )}
                  <button
                    onClick={() => toggleEmailNotif(user)}
                    disabled={togglingId === user.id}
                    title={user.emailNotifications ? 'מקבל התראות מייל — לחץ לביטול' : 'לא מקבל התראות — לחץ להפעלה'}
                    className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                      user.emailNotifications
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {user.emailNotifications ? <Bell size={14} /> : <BellOff size={14} />}
                  </button>
                  {user.id !== currentUser?.id && (
                    deleteConfirm === user.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(user)}
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">
                          אשר מחיקה
                        </button>
                        <button onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors">
                          ביטול
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(user.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
