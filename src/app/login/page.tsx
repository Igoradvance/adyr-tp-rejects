'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { VERSION, BUILD, BUILD_DATE } from '@/lib/version'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const { login, currentUser, authLoading } = useStore()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { setError('הכנס אימייל לאיפוס סיסמה'); return }
    setResetLoading(true)
    setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    if (err) setError(err.message)
    else setResetSent(true)
  }

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

        {/* Reset mode */}
        {resetMode ? (
          resetSent ? (
            <div className="text-center space-y-4">
              <div className="text-4xl mb-2">📧</div>
              <p className="text-gray-700 font-semibold">נשלח מייל לאיפוס סיסמה</p>
              <p className="text-gray-400 text-sm">בדוק את תיבת הדואר שלך ולחץ על הקישור</p>
              <button onClick={() => { setResetMode(false); setResetSent(false) }}
                className="text-blue-600 text-sm underline">חזור לכניסה</button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-gray-500 text-right">הכנס את האימייל שלך ונשלח קישור לאיפוס סיסמה</p>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required autoFocus dir="ltr"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors" />
              {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>}
              <button type="submit" disabled={resetLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 hover:bg-blue-700 transition-colors">
                {resetLoading ? 'שולח...' : 'שלח קישור לאיפוס'}
              </button>
              <button type="button" onClick={() => { setResetMode(false); setError('') }}
                className="w-full py-2 text-gray-500 text-sm hover:text-gray-700">← חזור לכניסה</button>
            </form>
          )
        ) : (

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
          <button type="button" onClick={() => { setResetMode(true); setError('') }}
            className="w-full text-center text-sm text-blue-500 hover:text-blue-700 pt-1">
            שכחתי סיסמה
          </button>
        </form>
        )}

        <div className="text-center text-xs text-gray-400 mt-6 space-y-0.5">
          <p>© 2026 Igor Ositchansky – Advance Engineering. כל הזכויות שמורות.</p>
          <p>v{VERSION} · Build {BUILD} · {BUILD_DATE}</p>
        </div>
      </div>
    </div>
  )
}
