import { Ticket } from '@/types'

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleString('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getOpenDuration(ticket: Ticket): string {
  const start = new Date(ticket.openedAt)
  const end = ticket.status === 'סגור' && ticket.closedAt ? new Date(ticket.closedAt) : new Date()
  const ms = end.getTime() - start.getTime()
  const hours = Math.floor(ms / 3600000)
  if (hours < 24) return `${hours} שע׳`
  const days = Math.floor(hours / 24)
  return `${days} ימים`
}

export function getRowHighlight(ticket: Ticket): string {
  if (ticket.status === 'סגור') return ''
  if (!ticket.testDate) return ''

  const testDate = new Date(ticket.testDate)
  testDate.setHours(23, 59, 59, 0)
  const now = new Date()
  const diffMs = testDate.getTime() - now.getTime()
  const diffDays = diffMs / 86400000

  if (diffDays < 0) return 'bg-red-50 border-r-4 border-red-400'
  if (diffDays <= 2) return 'bg-yellow-50 border-r-4 border-yellow-400'
  return ''
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}
