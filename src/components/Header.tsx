'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { useRouter } from 'next/navigation'
import { LogOut, Plus } from 'lucide-react'
import NewTicketModal from './NewTicketModal'
import UserManagement from './UserManagement'
import { UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'סופר אדמין',
  quality_control: 'בקרת איכות',
  contractor_pm: 'מנהל פרוייקט',
  contractor_employee: 'עובד קבלן',
}

export default function Header() {
  const { currentUser, logout } = useStore()
  const router = useRouter()
  const [showNew, setShowNew] = useState(false)
  const [showUsers, setShowUsers] = useState(false)

  const canCreate = currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control'
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
            {canManageUsers && (
              <button
                onClick={() => setShowUsers(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                <span>👥</span>
                <span className="hidden sm:inline">משתמשים</span>
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
    </>
  )
}
