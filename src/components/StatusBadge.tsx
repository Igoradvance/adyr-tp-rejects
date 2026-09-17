import { Status } from '@/types'
import { CircleAlert, Wrench, Hourglass, CircleCheck } from 'lucide-react'

const cfg: Record<Status, { cls: string; Icon: typeof CircleAlert }> = {
  'פתוח': { cls: 'bg-red-50 text-red-700 border-red-200', Icon: CircleAlert },
  'בטיפול': { cls: 'bg-navy-100 text-navy-600 border-navy-200', Icon: Wrench },
  'ממתין לאישור': { cls: 'bg-amber-50 text-amber-700 border-amber-200', Icon: Hourglass },
  'סגור': { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CircleCheck },
}

export default function StatusBadge({ status, size = 'sm' }: { status: Status; size?: 'sm' | 'md' }) {
  const { cls, Icon } = cfg[status] ?? cfg['פתוח']
  const sz = size === 'md' ? 'text-[12.5px] px-3 py-1' : 'text-[11.5px] px-2.5 py-[3px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-bold whitespace-nowrap leading-tight ${sz} ${cls}`}>
      <Icon size={size === 'md' ? 13 : 12} strokeWidth={2.4} />
      {status}
    </span>
  )
}
