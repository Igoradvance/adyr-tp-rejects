'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { MOCK_USERS } from '@/lib/mockData'
import { UserRole } from '@/types'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'סופר אדמין',
  quality_control: 'בקרת איכות',
  contractor_pm: 'מנהל פרוייקט קבלן',
  contractor_employee: 'עובד קבלן',
}

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700',
  quality_control: 'bg-green-100 text-green-700',
  contractor_pm: 'bg-blue-100 text-blue-700',
  contractor_employee: 'bg-gray-100 text-gray-700',
}

export default function LoginPage() {
  const { login } = useStore()
  const router = useRouter()
  const [selected, setSelected] = useState('')

  const handleLogin = () => {
    if (!selected) return
    login(selected)
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-white text-xl font-black tracking-tight">TP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">מערכת ניהול תקלות</h1>
          <p className="text-gray-500 mt-1 text-sm">בחר משתמש לכניסה (סביבת דמו)</p>
        </div>

        <div className="space-y-2 mb-6">
          {MOCK_USERS.map(user => (
            <button
              key={user.id}
              onClick={() => setSelected(user.id)}
              className={`w-full p-4 rounded-xl border-2 text-right transition-all ${
                selected === user.id
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-semibold text-gray-900">{user.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
                {user.contractor && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    user.contractor === 'TMT' ? 'bg-orange-100 text-orange-700' : 'bg-cyan-100 text-cyan-700'
                  }`}>
                    {user.contractor}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={!selected}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-40 hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
        >
          כניסה למערכת
        </button>
      </div>
    </div>
  )
}
