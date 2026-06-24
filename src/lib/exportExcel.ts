import * as XLSX from 'xlsx'
import { Ticket } from '@/types'

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function openDays(ticket: Ticket): number {
  const start = new Date(ticket.openedAt)
  const end = ticket.status === 'סגור' && ticket.closedAt ? new Date(ticket.closedAt) : new Date()
  return Math.floor((end.getTime() - start.getTime()) / 86400000)
}

const STATUS_HEB: Record<string, string> = {
  'פתוח': 'פתוח', 'בטיפול': 'בטיפול', 'ממתין לאישור': 'ממתין לאישור', 'סגור': 'סגור',
}

export function exportToExcel(tickets: Ticket[], exporterName: string) {
  const wb = XLSX.utils.book_new()

  // ── Sheet 1: KPI Dashboard ──────────────────────────────────────────────
  const total = tickets.length
  const byStatus = {
    'פתוח': tickets.filter(t => t.status === 'פתוח').length,
    'בטיפול': tickets.filter(t => t.status === 'בטיפול').length,
    'ממתין לאישור': tickets.filter(t => t.status === 'ממתין לאישור').length,
    'סגור': tickets.filter(t => t.status === 'סגור').length,
  }
  const byContractor = {
    TMT: tickets.filter(t => t.contractor === 'TMT').length,
    EBS: tickets.filter(t => t.contractor === 'EBS').length,
  }
  const byPriority = {
    'גבוהה': tickets.filter(t => t.priority === 'גבוהה').length,
    'בינונית': tickets.filter(t => t.priority === 'בינונית').length,
    'נמוכה': tickets.filter(t => t.priority === 'נמוכה').length,
  }
  const openTickets = tickets.filter(t => t.status !== 'סגור')
  const avgOpenDays = openTickets.length
    ? Math.round(openTickets.reduce((s, t) => s + openDays(t), 0) / openTickets.length)
    : 0
  const closedTickets = tickets.filter(t => t.status === 'סגור')
  const avgCloseDays = closedTickets.length
    ? Math.round(closedTickets.reduce((s, t) => s + openDays(t), 0) / closedTickets.length)
    : 0
  const withChat = tickets.filter(t => t.chatMessages.length > 0).length
  const closeRate = total ? Math.round((byStatus['סגור'] / total) * 100) : 0

  const kpiRows = [
    ['מערכת TP Reject – דוח KPI', '', '', ''],
    [`תאריך הפקה: ${formatDate(new Date().toISOString())}`, '', `מופק ע"י: ${exporterName}`, ''],
    ['', '', '', ''],
    ['📊 סיכום כללי', '', '', ''],
    ['סה"כ תקלות', total, '', ''],
    ['שיעור סגירה', `${closeRate}%`, '', ''],
    ['ממוצע ימים פתוח', avgOpenDays, '', ''],
    ['ממוצע ימים לסגירה', avgCloseDays, '', ''],
    ['תקלות עם תכתובת', withChat, '', ''],
    ['', '', '', ''],
    ['📋 לפי סטטוס', '', '', ''],
    ['פתוח', byStatus['פתוח'], '', ''],
    ['בטיפול', byStatus['בטיפול'], '', ''],
    ['ממתין לאישור', byStatus['ממתין לאישור'], '', ''],
    ['סגור', byStatus['סגור'], '', ''],
    ['', '', '', ''],
    ['🏗️ לפי קבלן', '', '', ''],
    ['TMT', byContractor.TMT, '', ''],
    ['EBS', byContractor.EBS, '', ''],
    ['', '', '', ''],
    ['⚡ לפי עדיפות', '', '', ''],
    ['גבוהה', byPriority['גבוהה'], '', ''],
    ['בינונית', byPriority['בינונית'], '', ''],
    ['נמוכה', byPriority['נמוכה'], '', ''],
  ]

  const wsKPI = XLSX.utils.aoa_to_sheet(kpiRows)
  wsKPI['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 24 }, { wch: 14 }]
  wsKPI['!rtl'] = true
  XLSX.utils.book_append_sheet(wb, wsKPI, 'KPI Dashboard')

  // ── Sheet 2: All Tickets ────────────────────────────────────────────────
  const headers = [
    'מס׳ תיק', 'קבלן', 'סטטוס', 'עדיפות', 'שלב טסט',
    'תאריך פתיחה', 'תאריך יעד', 'תאריך טסט', 'ימים פתוח',
    'משוייך ל', 'פתח ע"י', 'הודעות צ\'אט', 'תיאור תקלה',
  ]

  const rows = tickets.map(t => [
    t.ticketNumber,
    t.contractor,
    STATUS_HEB[t.status] || t.status,
    t.priority,
    t.testPhase || '',
    formatDate(t.openedAt),
    formatDate(t.targetDate),
    formatDate(t.testDate),
    openDays(t),
    t.assignedToName || '',
    t.createdByName,
    t.chatMessages.length,
    t.description,
  ])

  const wsTickets = XLSX.utils.aoa_to_sheet([headers, ...rows])
  wsTickets['!cols'] = [
    { wch: 22 }, { wch: 8 }, { wch: 16 }, { wch: 10 }, { wch: 14 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 12 },
    { wch: 18 }, { wch: 18 }, { wch: 10 }, { wch: 50 },
  ]
  wsTickets['!rtl'] = true

  // Style header row bold
  const range = XLSX.utils.decode_range(wsTickets['!ref'] || 'A1')
  for (let c = range.s.c; c <= range.e.c; c++) {
    const cell = wsTickets[XLSX.utils.encode_cell({ r: 0, c })]
    if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'DBEAFE' } } }
  }

  XLSX.utils.book_append_sheet(wb, wsTickets, 'תקלות')

  // ── Sheet 3: Open tickets only ──────────────────────────────────────────
  const openRows = tickets
    .filter(t => t.status !== 'סגור')
    .map(t => [
      t.ticketNumber, t.contractor, t.status, t.priority,
      formatDate(t.openedAt), formatDate(t.targetDate), openDays(t),
      t.assignedToName || '', t.description,
    ])

  const wsOpen = XLSX.utils.aoa_to_sheet([
    ['מס׳ תיק', 'קבלן', 'סטטוס', 'עדיפות', 'תאריך פתיחה', 'תאריך יעד', 'ימים פתוח', 'משוייך ל', 'תיאור'],
    ...openRows,
  ])
  wsOpen['!cols'] = [
    { wch: 22 }, { wch: 8 }, { wch: 16 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 50 },
  ]
  wsOpen['!rtl'] = true
  XLSX.utils.book_append_sheet(wb, wsOpen, 'תקלות פתוחות')

  // ── Export ──────────────────────────────────────────────────────────────
  const date = new Date().toLocaleDateString('he-IL').replace(/\//g, '-')
  XLSX.writeFile(wb, `TP-Reject-Report-${date}.xlsx`)
}
