'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { LogOut, Plus, KeyRound, BarChart2, Settings } from 'lucide-react'
import NewTicketModal from './NewTicketModal'
import UserManagement from './UserManagement'
import SettingsModal from './SettingsModal'
import { UserRole } from '@/types'
import { supabase } from '@/lib/supabase'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'סופר אדמין',
  quality_control: 'בקרת איכות',
  contractor_pm: 'מנהל פרוייקט',
  contractor_employee: 'עובד קבלן',
  viewer: 'צפייה בלבד',
}

export default function Header() {
  const { currentUser, logout } = useStore()
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) { setPwMsg('סיסמה חייבת להיות לפחות 6 תווים'); return }
    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)
    if (error) { setPwMsg('שגיאה: ' + error.message) }
    else { setPwMsg('הסיסמה עודכנה בהצלחה!'); setNewPassword(''); setTimeout(() => { setShowPassword(false); setPwMsg('') }, 1500) }
  }

  const isViewer = currentUser?.role === 'viewer'
  const canCreate = !isViewer && (currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control')
  const canManageUsers = currentUser?.role === 'super_admin'

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-200">
              <span className="text-white text-sm font-black tracking-tight">TP</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-gray-900 leading-tight">מערכת ניהול תקלות</p>
              <p className="text-xs text-gray-400 leading-tight">TP Reject Management</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {(currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control') && (
              <button
                onClick={() => router.push('/kpi')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                title="דשבורד KPI"
              >
                <BarChart2 size={15} />
                <span className="hidden sm:inline">KPI</span>
              </button>
            )}
            {canManageUsers && (
              <button
                onClick={() => setShowUsers(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                <span>👥</span>
                <span className="hidden sm:inline">משתמשים</span>
              </button>
            )}
            {canManageUsers && (
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                title="הגדרות מערכת"
              >
                <Settings size={15} />
                <span className="hidden sm:inline">הגדרות</span>
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => setShowNew(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">תקלה חדשה</span>
                <span className="sm:hidden">חדש</span>
              </button>
            )}

            {/* User chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
              <div className="text-right leading-tight">
                <p className="text-sm font-semibold text-gray-900">{currentUser?.name}</p>
                <p className="text-xs text-gray-400">{ROLE_LABELS[currentUser?.role || 'contractor_employee']}</p>
              </div>
              {currentUser?.contractor && (
                <span className={`px-2 py-0.5 rounded-lg text-xs font-bold flex-shrink-0 ${
                  currentUser.contractor === 'TMT' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
                }`}>
                  {currentUser.contractor}
                </span>
              )}
            </div>

            <button
              onClick={() => { setShowPassword(true); setPwMsg('') }}
              title="שנה סיסמה"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <KeyRound size={17} />
            </button>

            <button
              onClick={() => { logout(); router.push('/login') }}
              title="יציאה"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {showNew && <NewTicketModal onClose={() => setShowNew(false)} />}
      {showUsers && <UserManagement onClose={() => setShowUsers(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showPassword && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <KeyRound size={18} className="text-blue-600" /> שינוי סיסמה
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה חדשה</label>
                <input
                  type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="לפחות 6 תווים" dir="ltr" autoFocus
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {pwMsg && (
                <p className={`text-sm px-3 py-2 rounded-lg ${pwMsg.includes('הצלחה') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {pwMsg}
                </p>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={pwLoading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {pwLoading ? 'מעדכן...' : 'עדכן סיסמה'}
                </button>
                <button type="button" onClick={() => { setShowPassword(false); setNewPassword(''); setPwMsg('') }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors">
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
