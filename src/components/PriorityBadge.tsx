import { Priority } from '@/types'

const cfg: Record<Priority, { dot: string; cls: string }> = {
  'גבוהה': { dot: 'bg-red-500', cls: 'text-red-700 bg-red-50' },
  'בינונית': { dot: 'bg-amber-400', cls: 'text-amber-700 bg-amber-50' },
  'נמוכה': { dot: 'bg-green-500', cls: 'text-green-700 bg-green-50' },
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { dot, cls } = cfg[priority]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />
      {priority}
    </span>
  )
}
