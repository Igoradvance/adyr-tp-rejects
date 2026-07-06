'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { X, Settings, Mail, MailX } from 'lucide-react'

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useStore()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const toggleEmails = async () => {
    setError('')
    setSaving(true)
    try {
      await updateSettings({ emailsEnabled: !settings.emailsEnabled })
    } catch (e) {
      setError('שמירה נכשלה: ' + (e instanceof Error ? e.message : 'שגיאה'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings size={18} className="text-blue-600" /> הגדרות מערכת
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Email notifications toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                settings.emailsEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'
              }`}>
                {settings.emailsEnabled ? <Mail size={18} /> : <MailX size={18} />}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">התראות מייל בפתיחת תקלה</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {settings.emailsEnabled
                    ? 'מנהלי הפרוייקט מקבלים מייל אוטומטי בכל תקלה חדשה'
                    : 'שליחת המיילים מושהית — לא יישלחו התראות'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleEmails}
              disabled={saving}
              className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
                settings.emailsEnabled ? 'bg-green-500' : 'bg-gray-300'
              }`}
              role="switch"
              aria-checked={settings.emailsEnabled}
            >
              <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
                settings.emailsEnabled ? 'right-1' : 'right-6'
              }`} />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg break-all">
              {error}
            </div>
          )}

          <p className="text-xs text-gray-400 text-center pt-2">
            ההגדרות משפיעות על כל המשתמשים במערכת (גלובלי)
          </p>
        </div>
      </div>
    </div>
  )
}
