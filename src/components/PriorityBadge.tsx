import { Priority } from '@/types'
import { Flag } from 'lucide-react'

const cfg: Record<Priority, string> = {
  'גבוהה': 'bg-red-50 text-red-700',
  'בינונית': 'bg-amber-50 text-amber-700',
  'נמוכה': 'bg-emerald-50 text-emerald-700',
}

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const cls = cfg[priority] ?? cfg['בינונית']
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full text-[11.5px] font-bold whitespace-nowrap leading-tight ${cls}`}>
      <Flag size={11} strokeWidth={2.6} fill="currentColor" />
      {priority}
    </span>
  )
}
