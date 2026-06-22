'use client'
import { useStore } from '@/lib/store'
import { Search, X } from 'lucide-react'
import { Contractor, Priority, TestPhase } from '@/types'

export default function Filters() {
  const { filters, setFilters, currentUser } = useStore()
  const showContractor = currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control'

  const hasActiveFilters = filters.search || filters.contractor !== 'all' ||
    filters.priority !== 'all' || filters.testPhase !== 'all' || filters.assignedTo

  return (
    <div className="bg-white border-x border-b border-gray-200 px-4 py-3 flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="חיפוש לפי כל פרמטר..."
          value={filters.search}
          onChange={e => setFilters({ search: e.target.value })}
          className="w-full pr-9 pl-7 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ search: '' })}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showContractor && (
        <select
          value={filters.contractor}
          onChange={e => setFilters({ contractor: e.target.value as Contractor | 'all' })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="all">כל הקבלנים</option>
          <option value="TMT">TMT</option>
          <option value="EBS">EBS</option>
        </select>
      )}

      <select
        value={filters.priority}
        onChange={e => setFilters({ priority: e.target.value as Priority | 'all' })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="all">כל העדיפויות</option>
        <option value="גבוהה">עדיפות גבוהה</option>
        <option value="בינונית">עדיפות בינונית</option>
        <option value="נמוכה">עדיפות נמוכה</option>
      </select>

      <select
        value={filters.testPhase}
        onChange={e => setFilters({ testPhase: e.target.value as TestPhase | 'all' | 'none' })}
        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="all">כל שלבי טסט</option>
        <option value="לפני טסט">לפני טסט</option>
        <option value="אחרי טסט">אחרי טסט</option>
        <option value="none">ללא שלב טסט</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={() => setFilters({ search: '', contractor: 'all', priority: 'all', testPhase: 'all', assignedTo: '' })}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={14} />
          נקה סינון
        </button>
      )}
    </div>
  )
}
