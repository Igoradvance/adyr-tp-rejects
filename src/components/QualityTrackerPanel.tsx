'use client'
import { useState, useEffect } from 'react'
import { fetchQualityCase, QualityCase } from '@/lib/firebase'
import { RefreshCw, MapPin, Clock } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  'open': 'bg-blue-100 text-blue-700',
  'in_progress': 'bg-yellow-100 text-yellow-700',
  'pending': 'bg-orange-100 text-orange-700',
  'closed': 'bg-green-100 text-green-700',
  'planning': 'bg-purple-100 text-purple-700',
  'פתוח': 'bg-blue-100 text-blue-700',
  'בטיפול': 'bg-yellow-100 text-yellow-700',
  'ממתין': 'bg-orange-100 text-orange-700',
  'סגור': 'bg-green-100 text-green-700',
}

export default function QualityTrackerPanel({ ticketNumber }: { ticketNumber: string }) {
  const [data, setData] = useState<QualityCase | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = async () => {
    setLoading(true)
    setNotFound(false)
    setData(null)
    const result = await fetchQualityCase(ticketNumber)
    if (result) setData(result)
    else setNotFound(true)
    setLoading(false)
  }

  useEffect(() => { load() }, [ticketNumber]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="border border-indigo-200 rounded-xl bg-indigo-50/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-100/60 border-b border-indigo-200">
        <div className="flex items-center gap-2">
          <MapPin size={15} className="text-indigo-600" />
          <span className="text-sm font-bold text-indigo-800">Quality Tracker</span>
          <span className="text-xs text-indigo-500 font-mono">{ticketNumber}</span>
        </div>
        <button onClick={load} disabled={loading}
          className="p-1.5 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-40">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-indigo-500">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            טוען נתונים...
          </div>
        ) : notFound ? (
          <p className="text-sm text-gray-400 italic">לא נמצא רשומה תואמת ב-Quality Tracker</p>
        ) : data ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">סטטוס</p>
                <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-semibold ${STATUS_COLORS[data.status] || 'bg-gray-100 text-gray-600'}`}>
                  {data.status}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">קבלן</p>
                <p className="font-semibold text-gray-800">{data.contractor || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">אחראי</p>
                <p className="font-semibold text-gray-800">{data.assignee || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">סוג בדיקה</p>
                <p className="font-semibold text-gray-800">{data.testType || '—'}</p>
              </div>
              {data.waterBar && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-0.5">Water Bar</p>
                  <p className="font-semibold text-gray-800">{data.waterBar}</p>
                </div>
              )}
            </div>
            {data.history && data.history.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                  <Clock size={11} /> היסטוריית עדכונים ({data.history.length})
                </p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {[...data.history].reverse().map((h, i) => (
                    <div key={i} className="bg-white rounded-lg px-3 py-1.5 text-xs border border-indigo-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-700">{h.status}</span>
                        <span className="text-gray-400">{h.at ? new Date(h.at).toLocaleDateString('he-IL') : ''}</span>
                      </div>
                      {h.note && <p className="text-gray-500 mt-0.5">{h.note}</p>}
                      {h.by && <p className="text-gray-400">ע"י {h.by}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
