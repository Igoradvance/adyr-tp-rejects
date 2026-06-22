import { Status } from '@/types'

const cfg: Record<Status, string> = {
  'פתוח': 'bg-red-100 text-red-700 border border-red-200',
  'בטיפול': 'bg-blue-100 text-blue-700 border border-blue-200',
  'ממתין לאישור': 'bg-amber-100 text-amber-700 border border-amber-200',
  'סגור': 'bg-green-100 text-green-700 border border-green-200',
}

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg[status]}`}>
      {status}
    </span>
  )
}
