import { createClient } from '@supabase/supabase-js'
import { Ticket } from '@/types'

export const supabase = createClient(
  'https://vdnbavacjilmgxijarkv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkbmJhdmFjamlsbWd4aWphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODE1ODYsImV4cCI6MjA5NzY1NzU4Nn0.qczuPeUXbCdNMxm3vrj_5XoRt19l-AkuFW3ARdRdnUA'
)

// Map DB row (snake_case) → Ticket (camelCase)
export function rowToTicket(row: Record<string, unknown>): Ticket {
  return {
    id: row.id as string,
    ticketNumber: row.ticket_number as string,
    contractor: row.contractor as Ticket['contractor'],
    assignedToId: (row.assigned_to_id as string) || undefined,
    assignedToName: (row.assigned_to_name as string) || undefined,
    status: row.status as Ticket['status'],
    priority: row.priority as Ticket['priority'],
    description: row.description as string,
    testPhase: (row.test_phase as Ticket['testPhase']) || undefined,
    targetDate: (row.target_date as string) || undefined,
    testDate: (row.test_date as string) || undefined,
    notes: (row.notes as string) || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    openedAt: row.opened_at as string,
    closedAt: (row.closed_at as string) || undefined,
    createdByName: row.created_by_name as string,
    createdById: row.created_by_id as string,
    chatMessages: (row.chat_messages as Ticket['chatMessages']) || [],
    statusHistory: (row.status_history as Ticket['statusHistory']) || [],
    checklist: (row.checklist as Ticket['checklist']) || [],
  }
}

// Map Ticket (camelCase) → DB row (snake_case)
export function ticketToRow(t: Ticket): Record<string, unknown> {
  return {
    id: t.id,
    ticket_number: t.ticketNumber,
    contractor: t.contractor,
    assigned_to_id: t.assignedToId ?? null,
    assigned_to_name: t.assignedToName ?? null,
    status: t.status,
    priority: t.priority,
    description: t.description,
    test_phase: t.testPhase ?? null,
    target_date: t.targetDate ?? null,
    test_date: t.testDate ?? null,
    notes: t.notes ?? '',
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    opened_at: t.openedAt,
    closed_at: t.closedAt ?? null,
    created_by_name: t.createdByName,
    created_by_id: t.createdById,
    chat_messages: t.chatMessages,
    status_history: t.statusHistory,
    checklist: t.checklist,
  }
}
