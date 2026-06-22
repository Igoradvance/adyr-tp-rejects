import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Ticket } from '@/types'

let _client: SupabaseClient | null = null

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vdnbavacjilmgxijarkv.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkbmJhdmFjamlsbWd4aWphcmt2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODE1ODYsImV4cCI6MjA5NzY1NzU4Nn0.qczuPeUXbCdNMxm3vrj_5XoRt19l-AkuFW3ARdRdnUA'

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(SUPABASE_URL, SUPABASE_ANON)
  }
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop, _receiver) {
    const client = getSupabase()
    const value = (client as unknown as Record<string | symbol, unknown>)[prop]
    if (typeof value === 'function') {
      return (value as Function).bind(client)
    }
    return value
  },
})

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
  }
}
