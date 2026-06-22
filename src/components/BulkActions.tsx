'use client'
import { useStore } from '@/lib/store'
import { Status } from '@/types'
import { X, Zap } from 'lucide-react'

export default function BulkActions() {
  const { selectedIds, clearSelection, bulkUpdateStatus, currentUser } = useStore()

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
    <div className="border-x border-b border-gray-200 bg-blue-50 px-4 py-2.5 flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
        <Zap size={15} />
        {selectedIds.length} תקלות נבחרו
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">שנה סטטוס:</span>
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => bulkUpdateStatus(selectedIds, status)}
            className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
          >
            {status}
          </button>
        ))}
      </div>

      <button
        onClick={clearSelection}
        className="mr-auto flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <X size={13} />
        בטל בחירה
      </button>
    </div>
  )
}
