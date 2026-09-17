'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Status } from '@/types'
import { X, ListChecks, Trash2 } from 'lucide-react'

export default function BulkActions() {
  const { selectedIds, clearSelection, bulkUpdateStatus, deleteTicket, currentUser } = useStore()
  const [confirming, setConfirming] = useState(false)

  const handleBulkDelete = async () => {
    await Promise.all(selectedIds.map(id => deleteTicket(id)))
    clearSelection()
    setConfirming(false)
  }

  const allowedStatuses = (): Status[] => {
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control') {
      return ['פתוח', 'בטיפול', 'ממתין לאישור', 'סגור']
    }
    if (currentUser?.role === 'contractor_pm' || currentUser?.role === 'contractor_employee') {
      return ['בטיפול', 'ממתין לאישור']
    }
    return []
  }

  const statuses = allowedStatuses()
  if (statuses.length === 0) return null

  return (
    <div className="qt-fade-up border-b border-line bg-navy-100 px-3 sm:px-4 py-2.5 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-[13px] font-bold text-navy-600">
        <ListChecks size={16} strokeWidth={2.4} />
        {selectedIds.length} תקלות נבחרו
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[12px] text-ink-muted font-semibold">שנה סטטוס:</span>
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => bulkUpdateStatus(selectedIds, status)}
            className="qt-btn px-3 py-1 text-[12px] font-bold bg-white border-[1.5px] border-line rounded-full text-navy-600 shadow-sm hover:border-navy-400"
          >
            {status}
          </button>
        ))}
      </div>

      {currentUser?.role === 'super_admin' && (
        confirming ? (
          <div className="flex items-center gap-2 mr-auto">
            <span className="text-[12px] text-red-700 font-bold">למחוק {selectedIds.length} תקלות?</span>
            <button onClick={handleBulkDelete}
              className="qt-btn px-3 py-1 text-[12px] font-bold bg-red-600 text-white rounded-full">
              אשר מחיקה
            </button>
            <button onClick={() => setConfirming(false)}
              className="qt-btn px-3 py-1 text-[12px] font-semibold bg-white border border-line text-ink-muted rounded-full">
              ביטול
            </button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)}
            className="qt-btn mr-auto inline-flex items-center gap-1.5 px-3 py-1 text-[12px] font-bold text-red-700 border-[1.5px] border-red-200 bg-red-50 rounded-full">
            <Trash2 size={13} />
            מחק נבחרות
          </button>
        )
      )}

      <button
        onClick={clearSelection}
        className={`${currentUser?.role !== 'super_admin' ? 'mr-auto' : ''} qt-btn inline-flex items-center gap-1 text-[12px] font-semibold text-ink-muted hover:text-ink`}
      >
        <X size={13} strokeWidth={2.6} />
        בטל בחירה
      </button>
    </div>
  )
}
