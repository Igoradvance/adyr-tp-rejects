'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useRouter, usePathname } from 'next/navigation'
import { LogOut, Plus, KeyRound, BarChart2, Settings, Users, LayoutDashboard, ClipboardCheck } from 'lucide-react'
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

const navBtn = 'qt-btn inline-flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[13.5px] font-bold whitespace-nowrap'
const navIdle = `${navBtn} text-ink-muted hover:bg-navy-100`
const navActive = `${navBtn} bg-navy-600 text-white shadow-sm`

export default function Header() {
  const { currentUser, logout } = useStore()
  const router = useRouter()
  const pathname = usePathname()
  const [showNew, setShowNew] = useState(false)
  const [showUsers, setShowUsers] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [logoOk, setLogoOk] = useState(true)

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
  const isQCOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control'
  const canCreate = !isViewer && isQCOrAdmin
  const canManageUsers = currentUser?.role === 'super_admin'
  const onKpi = pathname?.startsWith('/kpi')

  return (
    <>
      <header
        className="bg-white border-b border-line sticky top-0 z-40 shadow-sm"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 flex-wrap">
          {/* Logo */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-3 min-w-0 flex-shrink-0 text-right"
            title="לדשבורד"
          >
            {logoOk ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/logo.png"
                alt="ADYR"
                onError={() => setLogoOk(false)}
                className="h-12 w-auto max-w-[min(260px,52vw)] object-contain block"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-navy-100 text-navy-600 flex items-center justify-center">
                <ClipboardCheck size={22} strokeWidth={2.2} />
              </div>
            )}
          </button>

          {/* Nav + actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <nav className="flex items-center gap-1 p-1 bg-[#EEF2F7] border border-line rounded-[14px]">
              <button onClick={() => router.push('/dashboard')} className={!onKpi ? navActive : navIdle} title="תקלות">
                <LayoutDashboard size={15} strokeWidth={2.3} />
                <span className="hidden sm:inline">תקלות</span>
              </button>
              {isQCOrAdmin && (
                <button onClick={() => router.push('/kpi')} className={onKpi ? navActive : navIdle} title="דשבורד KPI">
                  <BarChart2 size={15} strokeWidth={2.3} />
                  <span className="hidden sm:inline">KPI</span>
                </button>
              )}
              {canManageUsers && (
                <button onClick={() => setShowUsers(true)} className={navIdle} title="ניהול משתמשים">
                  <Users size={15} strokeWidth={2.3} />
                  <span className="hidden sm:inline">משתמשים</span>
                </button>
              )}
              {canManageUsers && (
                <button onClick={() => setShowSettings(true)} className={navIdle} title="הגדרות מערכת">
                  <Settings size={15} strokeWidth={2.3} />
                  <span className="hidden sm:inline">הגדרות</span>
                </button>
              )}
            </nav>

            {canCreate && (
              <button
                onClick={() => setShowNew(true)}
                className="qt-btn inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 text-white rounded-xl text-[13.5px] font-bold shadow-sm"
              >
                <Plus size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">תקלה חדשה</span>
                <span className="sm:hidden">חדש</span>
              </button>
            )}

            {/* User chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-100 border border-line rounded-xl">
              <div className="text-right leading-tight">
                <p className="text-[13px] font-bold text-navy-600">{currentUser?.name}</p>
                <p className="text-[11px] text-ink-muted font-semibold">{ROLE_LABELS[currentUser?.role || 'contractor_employee']}</p>
              </div>
              {currentUser?.contractor && (
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold flex-shrink-0 ${
                  currentUser.contractor === 'TMT' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
                }`}>
                  {currentUser.contractor}
                </span>
              )}
            </div>

            <button
              onClick={() => { setShowPassword(true); setPwMsg('') }}
              title="שנה סיסמה"
              aria-label="שנה סיסמה"
              className="qt-btn w-10 h-10 inline-flex items-center justify-center rounded-xl bg-[#EEF2F7] border border-line text-navy-600"
            >
              <KeyRound size={17} strokeWidth={2.2} />
            </button>

            <button
              onClick={() => { logout(); router.push('/login') }}
              title="יציאה"
              aria-label="יציאה"
              className="qt-btn w-10 h-10 inline-flex items-center justify-center rounded-xl bg-[#EEF2F7] border border-line text-navy-600"
            >
              <LogOut size={17} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </header>

      {showNew && <NewTicketModal onClose={() => setShowNew(false)} />}
      {showUsers && <UserManagement onClose={() => setShowUsers(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showPassword && (
        <div className="fixed inset-0 bg-[rgba(15,31,51,0.55)] z-50 flex items-center justify-center p-4 backdrop-blur-[3px]">
          <div className="qt-fade-up bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm border border-line">
            <h2 className="text-lg font-extrabold text-ink mb-4 flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-xl bg-navy-100 text-navy-600 inline-flex items-center justify-center">
                <KeyRound size={18} strokeWidth={2.3} />
              </span>
              שינוי סיסמה
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-bold text-[#3B4A5E] mb-1.5">סיסמה חדשה</label>
                <input
                  type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="לפחות 6 תווים" dir="ltr" autoFocus
                  className="w-full border-[1.5px] border-line bg-[#F8FAFD] rounded-xl px-4 py-2.5 text-sm"
                />
              </div>
              {pwMsg && (
                <p className={`text-sm px-3 py-2 rounded-xl border-[1.5px] ${pwMsg.includes('הצלחה') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {pwMsg}
                </p>
              )}
              <div className="flex gap-2">
                <button type="submit" disabled={pwLoading}
                  className="qt-btn flex-1 py-2.5 bg-navy-600 text-white rounded-xl text-sm font-bold">
                  {pwLoading ? 'מעדכן...' : 'עדכן סיסמה'}
                </button>
                <button type="button" onClick={() => { setShowPassword(false); setNewPassword(''); setPwMsg('') }}
                  className="qt-btn px-4 py-2.5 bg-[#EEF2F7] text-slate-700 rounded-xl text-sm font-semibold">
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

