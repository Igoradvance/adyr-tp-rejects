'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function LoginPage() {
  const { login, currentUser, authLoading } = useStore()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!authLoading && currentUser) router.replace('/dashboard')
  }, [currentUser, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await login(email.trim(), password)
    if (err) {
      setError(err)
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm border border-gray-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <span className="text-white text-xl font-black">TP</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">מערכת ניהול תקלות</h1>
          <p className="text-gray-400 text-sm mt-1">Advance Engineering</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              dir="ltr"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm mt-2"
          >
            {loading ? 'מתחבר...' : 'כניסה למערכת'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Igor Ositchansky – Advance Engineering
        </p>
      </div>
    </div>
  )
}
