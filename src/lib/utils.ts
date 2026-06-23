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
  if (ticket.status === 'סגור') return 'bg-green-50 border-r-4 border-green-400'
  return ''
}

export function getReadCount(userId: string, ticketId: string): number {
  if (typeof window === 'undefined') return 0
  return parseInt(localStorage.getItem(`read_${userId}_${ticketId}`) || '0', 10)
}

export function markMessagesRead(userId: string, ticketId: string, count: number) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`read_${userId}_${ticketId}`, String(count))
}

export function hasUnreadMessages(chatCount: number, userId: string, ticketId: string): boolean {
  return chatCount > 0 && chatCount > getReadCount(userId, ticketId)
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}
