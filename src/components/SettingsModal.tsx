'use client'
import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { X, Settings, Mail, MailX, Download, Upload, Database } from 'lucide-react'
import { downloadBackup, parseBackup } from '@/lib/backup'

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, tickets, importTickets } = useStore()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [backupMsg, setBackupMsg] = useState('')
  const [restoring, setRestoring] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

  const handleBackup = () => {
    downloadBackup(tickets)
    setBackupMsg(`הורדו ${tickets.length} תקלות לקובץ גיבוי`)
  }

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setPendingFile(f); setBackupMsg('') }
  }

  const confirmRestore = async () => {
    if (!pendingFile) return
    setRestoring(true)
    setBackupMsg('')
    try {
      const restored = await parseBackup(pendingFile)
      const count = await importTickets(restored)
      setBackupMsg(`שוחזרו ${count} תקלות בהצלחה`)
      setPendingFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (e) {
      setBackupMsg('שחזור נכשל: ' + (e instanceof Error ? e.message : 'שגיאה'))
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings size={18} className="text-blue-600" /> הגדרות מערכת
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
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

          {/* Backup & restore */}
          <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-blue-100 text-blue-600">
                <Database size={18} />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">גיבוי ושחזור נתונים</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  הורד גיבוי מלא של כל התקלות ({tickets.length}) לקובץ, או שחזר מקובץ גיבוי קיים
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleBackup}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Download size={15} /> הורד גיבוי
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                <Upload size={15} /> שחזר מגיבוי
              </button>
              <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleFilePick} className="hidden" />
            </div>

            {pendingFile && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
                <p className="text-xs text-amber-700">
                  קובץ נבחר: <span className="font-mono">{pendingFile.name}</span>
                  <br />
                  השחזור ימזג את התקלות מהקובץ (מעדכן קיימות לפי מזהה, מוסיף חדשות). לא מוחק תקלות שאינן בגיבוי.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={confirmRestore}
                    disabled={restoring}
                    className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                  >
                    {restoring ? 'משחזר...' : 'אשר שחזור'}
                  </button>
                  <button
                    onClick={() => { setPendingFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            )}

            {backupMsg && (
              <p className={`text-xs px-3 py-2 rounded-lg ${
                backupMsg.includes('נכשל') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
              }`}>
                {backupMsg}
              </p>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center pt-2">
            ההגדרות משפיעות על כל המשתמשים במערכת (גלובלי)
          </p>
        </div>
      </div>
    </div>
  )
}
