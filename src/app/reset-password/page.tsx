'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lock, KeyRound, CircleCheck, CircleAlert } from 'lucide-react'

const fieldCls = 'w-full border-[1.5px] border-line bg-[#F8FAFD] rounded-xl py-[11px] pr-10 pl-3 text-sm text-left'
const labelCls = 'flex items-center gap-1.5 text-[12.5px] font-bold text-[#3B4A5E] mb-1.5'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sends the token in the URL hash — onAuthStateChange picks it up
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('סיסמה חייבת להיות לפחות 6 תווים'); return }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (err) { setError(err.message) }
    else {
      setMsg('הסיסמה עודכנה בהצלחה! מועבר לכניסה...')
      setTimeout(() => router.replace('/login'), 2000)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 tp-main"
      style={{ background: 'radial-gradient(1200px 600px at 10% -10%, rgba(42,157,143,0.35), transparent 60%), linear-gradient(160deg, #0F2A4A 0%, #1B3A5C 60%, #2C5282 100%)' }}
    >
      <div className="qt-fade-up bg-white rounded-[24px] px-[26px] pt-[30px] pb-6 w-full max-w-[380px] shadow-xl">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-[20px] mx-auto mb-3 bg-navy-100 text-navy-600 flex items-center justify-center">
            <KeyRound size={30} strokeWidth={2} />
          </div>
          <h1 className="text-[20px] font-black text-ink tracking-tight">איפוס סיסמה</h1>
        </div>

        {msg ? (
          <div className="text-center space-y-3 py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CircleCheck size={26} strokeWidth={2.2} />
            </div>
            <p className="text-emerald-700 font-bold">{msg}</p>
          </div>
        ) : !ready ? (
          <div className="text-center space-y-3 py-2">
            <div className="w-8 h-8 border-4 border-navy-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-ink-muted text-sm font-semibold">מאמת קישור...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className={labelCls}><Lock size={13} className="text-ink-faint" /> סיסמה חדשה</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="לפחות 6 תווים" required autoFocus dir="ltr" className={fieldCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}><Lock size={13} className="text-ink-faint" /> אימות סיסמה</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
                <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  placeholder="חזור על הסיסמה" required dir="ltr" className={fieldCls} />
              </div>
            </div>
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-[13px] text-red-600 font-semibold pt-1">
                <CircleAlert size={15} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="qt-btn w-full py-[13px] bg-navy-600 text-white rounded-xl font-bold text-[15px] mt-2">
              {loading ? 'מעדכן...' : 'עדכן סיסמה'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
