import { Ticket } from '@/types'
import { BUILD } from './version'

export interface BackupFile {
  app: 'TP-Reject'
  build: number
  exportedAt: string
  ticketCount: number
  tickets: Ticket[]
}

// Trigger a client-side download of the full ticket backup as JSON
export function downloadBackup(tickets: Ticket[]) {
  const payload: BackupFile = {
    app: 'TP-Reject',
    build: BUILD,
    exportedAt: new Date().toISOString(),
    ticketCount: tickets.length,
    tickets,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  a.href = url
  a.download = `tp-reject-backup-${stamp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Parse and validate an uploaded backup file
export async function parseBackup(file: File): Promise<Ticket[]> {
  const text = await file.text()
  const data = JSON.parse(text) as BackupFile
  if (data.app !== 'TP-Reject' || !Array.isArray(data.tickets)) {
    throw new Error('קובץ הגיבוי אינו תקין')
  }
  return data.tickets
}
