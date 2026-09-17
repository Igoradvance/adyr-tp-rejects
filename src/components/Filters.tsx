'use client'
import { useStore } from '@/lib/store'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Contractor, Priority, TestPhase } from '@/types'

const selectCls = 'px-3 py-2 border-[1.5px] border-line rounded-xl text-[13px] font-semibold bg-white text-ink shadow-sm'

export default function Filters() {
  const { filters, setFilters, currentUser } = useStore()
  const showContractor = currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control'

  const hasActiveFilters = filters.search || filters.contractor !== 'all' ||
    filters.priority !== 'all' || filters.testPhase !== 'all' || filters.assignedTo

  return (
    <div className="bg-[#F8FAFD] border-b border-line px-3 sm:px-4 py-3 flex flex-wrap gap-2 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px] flex items-center">
        <Search size={16} className="absolute right-3.5 text-ink-faint pointer-events-none" strokeWidth={2.3} />
        <input
          type="text"
          placeholder="חיפוש לפי כל פרמטר..."
          value={filters.search}
          onChange={e => setFilters({ search: e.target.value })}
          className="w-full pr-10 pl-8 py-[9px] border-[1.5px] border-line rounded-xl text-sm bg-white shadow-sm"
        />
        {filters.search && (
          <button
            onClick={() => setFilters({ search: '' })}
            className="absolute left-2.5 text-ink-faint hover:text-ink"
            aria-label="נקה חיפוש"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <span className="hidden sm:inline-flex items-center gap-1.5 text-[12px] text-ink-faint font-bold">
        <SlidersHorizontal size={13} strokeWidth={2.4} /> סינון
      </span>

      {showContractor && (
        <select
          value={filters.contractor}
          onChange={e => setFilters({ contractor: e.target.value as Contractor | 'all' })}
          className={selectCls}
        >
          <option value="all">כל הקבלנים</option>
          <option value="TMT">TMT</option>
          <option value="EBS">EBS</option>
        </select>
      )}

      <select
        value={filters.priority}
        onChange={e => setFilters({ priority: e.target.value as Priority | 'all' })}
        className={selectCls}
      >
        <option value="all">כל העדיפויות</option>
        <option value="גבוהה">עדיפות גבוהה</option>
        <option value="בינונית">עדיפות בינונית</option>
        <option value="נמוכה">עדיפות נמוכה</option>
      </select>

      <select
        value={filters.testPhase}
        onChange={e => setFilters({ testPhase: e.target.value as TestPhase | 'all' | 'none' })}
        className={selectCls}
      >
        <option value="all">כל שלבי טסט</option>
        <option value="לפני טסט">לפני טסט</option>
        <option value="אחרי טסט">אחרי טסט</option>
        <option value="none">ללא שלב טסט</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={() => setFilters({ search: '', contractor: 'all', priority: 'all', testPhase: 'all', assignedTo: '' })}
          className="qt-btn inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-bold text-navy-600 bg-navy-100 rounded-xl"
        >
          <X size={13} strokeWidth={2.6} />
          נקה סינון
        </button>
      )}
    </div>
  )
}
