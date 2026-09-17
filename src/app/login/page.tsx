'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { VERSION, BUILD } from '@/lib/version'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, LogIn, CircleAlert, MailCheck, ArrowRight, ClipboardCheck } from 'lucide-react'

const fieldCls = 'w-full border-[1.5px] border-line bg-[#F8FAFD] rounded-xl py-[11px] pr-10 pl-3 text-sm'
const labelCls = 'flex items-center gap-1.5 text-[12.5px] font-bold text-[#3B4A5E] mb-1.5'

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
  const [logoOk, setLogoOk] = useState(true)

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
      setError(err === 'Invalid login credentials' ? 'אימייל או סיסמה שגויים' : err)
      setLoading(false)
    } else {
      router.replace('/dashboard')
    }
  }

  const shell = (children: React.ReactNode) => (
    <div
      className="min-h-screen flex items-center justify-center p-4 tp-main"
      style={{ background: 'radial-gradient(1200px 600px at 10% -10%, rgba(42,157,143,0.35), transparent 60%), linear-gradient(160deg, #0F2A4A 0%, #1B3A5C 60%, #2C5282 100%)' }}
    >
      {children}
    </div>
  )

  if (authLoading) return shell(
    <div className="w-9 h-9 border-4 border-white/70 border-t-transparent rounded-full animate-spin" />
  )

  return shell(
    <div className="qt-fade-up bg-white rounded-[24px] px-[26px] pt-[30px] pb-6 w-full max-w-[380px] shadow-xl">
      <div className="text-center mb-6">
        {logoOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo.png" alt="ADYR" onError={() => setLogoOk(false)}
            className="w-full max-w-[300px] h-auto block mx-auto mb-1" />
        ) : (
          <>
            <div className="w-16 h-16 rounded-[20px] mx-auto mb-2.5 bg-navy-100 text-navy-600 flex items-center justify-center">
              <ClipboardCheck size={32} strokeWidth={2} />
            </div>
            <h1 className="text-[22px] font-black text-navy-600 tracking-tight">ADYR TP Reject</h1>
          </>
        )}
        <p className="text-[13px] text-ink-muted mt-2 font-medium">
          {resetMode ? 'איפוס סיסמה למערכת ניהול התקלות' : 'כניסה למערכת ניהול תקלות על תיקי קבלנים'}
        </p>
      </div>

      {resetMode ? (
        resetSent ? (
          <div className="text-center space-y-3 py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <MailCheck size={26} strokeWidth={2.2} />
            </div>
            <p className="text-ink font-bold">נשלח מייל לאיפוס סיסמה</p>
            <p className="text-ink-muted text-sm">בדוק את תיבת הדואר שלך ולחץ על הקישור</p>
            <button onClick={() => { setResetMode(false); setResetSent(false) }}
              className="qt-btn inline-flex items-center gap-1.5 text-navy-500 text-sm font-bold mt-1">
              <ArrowRight size={15} /> חזור לכניסה
            </button>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-3">
            <p className="text-[13px] text-ink-muted">הכנס את האימייל שלך ונשלח קישור לאיפוס סיסמה</p>
            <div>
              <label className={labelCls}><Mail size={13} className="text-ink-faint" /> אימייל</label>
              <div className="relative">
                <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                  placeholder="your@email.com" required autoFocus dir="ltr" className={`${fieldCls} text-left`} />
              </div>
            </div>
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-[13px] text-red-600 font-semibold">
                <CircleAlert size={15} /> {error}
              </div>
            )}
            <button type="submit" disabled={resetLoading}
              className="qt-btn w-full inline-flex items-center justify-center gap-2 py-[13px] bg-navy-600 text-white rounded-xl font-bold text-[15px] mt-1">
              {resetLoading ? 'שולח...' : 'שלח קישור לאיפוס'}
            </button>
            <button type="button" onClick={() => { setResetMode(false); setError('') }}
              className="qt-btn w-full inline-flex items-center justify-center gap-1.5 py-2 text-ink-faint text-[13px] font-semibold">
              <ArrowRight size={14} /> חזור לכניסה
            </button>
          </form>
        )
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelCls}><Mail size={13} className="text-ink-faint" /> אימייל</label>
            <div className="relative">
              <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                placeholder="your@email.com" required autoFocus dir="ltr" autoComplete="username"
                className={`${fieldCls} text-left`} />
            </div>
          </div>
          <div>
            <label className={labelCls}><Lock size={13} className="text-ink-faint" /> סיסמה</label>
            <div className="relative">
              <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
              <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="הזן סיסמה" required dir="ltr" autoComplete="current-password"
                className={`${fieldCls} text-left`} />
            </div>
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-[13px] text-red-600 font-semibold pt-1">
              <CircleAlert size={15} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="qt-btn w-full inline-flex items-center justify-center gap-2 py-[13px] bg-navy-600 text-white rounded-xl font-bold text-[15px] mt-2">
            <LogIn size={17} strokeWidth={2.3} />
            {loading ? 'מתחבר...' : 'כניסה'}
          </button>
          <button type="button" onClick={() => { setResetMode(true); setError('') }}
            className="qt-btn w-full text-center text-[13px] text-ink-faint hover:text-navy-500 font-semibold pt-1">
            שכחתי סיסמה
          </button>
        </form>
      )}

      <div className="text-center mt-4 text-[10px] text-[#B8C3D1] tracking-wide tabular-nums" dir="ltr">
        v{VERSION} · Build {BUILD} · Quality today. Safer tomorrow.
      </div>
    </div>
  )
}
