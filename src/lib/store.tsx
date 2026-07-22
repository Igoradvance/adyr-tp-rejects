'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  Ticket, User, Status, FilterState,
  ChatMessage, StatusChange,
} from '@/types'
import { INITIAL_TICKETS } from './mockData'
import { supabase, rowToTicket, ticketToRow } from './supabase'
import { generateId } from './utils'
import { sendStatusChangeEmail } from './email'

interface StoreContextType {
  currentUser: User | null
  authLoading: boolean
  login: (email: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  tickets: Ticket[]
  filteredTickets: Ticket[]
  selectedIds: string[]
  filters: FilterState
  users: User[]
  ticketsLoading: boolean
  refreshUsers: () => Promise<void>
  createTicket: (data: Partial<Ticket>) => Promise<void>
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  updateStatus: (id: string, status: Status) => Promise<void>
  bulkUpdateStatus: (ids: string[], status: Status) => Promise<void>
  addChat: (ticketId: string, message: string) => Promise<void>
  deleteChat: (ticketId: string, messageId: string) => Promise<void>
  updateChecklist: (ticketId: string, checklist: import('@/types').ChecklistItem[]) => Promise<void>
  importTickets: (tickets: Ticket[]) => Promise<number>
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setFilters: (f: Partial<FilterState>) => void
}

export interface AppSettings {
  emailsEnabled: boolean
}

const DEFAULT_SETTINGS: AppSettings = { emailsEnabled: true }

const Ctx = createContext<StoreContextType | null>(null)

function profileToUser(p: Record<string, unknown>): User {
  return {
    id: p.id as string,
    name: p.name as string,
    email: p.email as string,
    role: p.role as User['role'],
    contractor: (p.contractor as User['contractor']) || undefined,
    emailNotifications: (p.email_notifications as boolean) ?? false,
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [authLoading, setAuthLoading] = useState(true)
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [filters, setFiltersState] = useState<FilterState>({
    search: '',
    status: 'all',
    contractor: 'all',
    priority: 'all',
    testPhase: 'all',
    assignedTo: '',
  })

  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    return data ? profileToUser(data) : null
  }, [])

  const refreshUsers = useCallback(async () => {
    try {
      // cache-busting timestamp param — guarantees fresh data past any CDN/browser cache
      const res = await fetch(`/api/users/list?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      if (json.users) setUsers(json.users.map(profileToUser))
    } catch (_e) {}
  }, [])

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(profile)
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const profile = await fetchProfile(session.user.id)
        setCurrentUser(profile)
      } else {
        setCurrentUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    setTicketsLoading(true)
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('opened_at', { ascending: false })

      if (!error && data) {
        setTickets(data.map(rowToTicket))
      }
    } catch (_e) {
      // fail silently
    } finally {
      setTicketsLoading(false)
    }
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  // Silent background polling fallback (in case realtime isn't enabled on the table)
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('updated_at', { ascending: false })
      if (!error && data) setTickets(data.map(rowToTicket))
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Realtime
  useEffect(() => {
    const ch = supabase.channel('tickets-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets(prev => [rowToTicket(payload.new as Record<string, unknown>), ...prev])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets(prev => prev.map(t => t.id === (payload.new as Record<string, unknown>).id ? rowToTicket(payload.new as Record<string, unknown>) : t))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets(prev => prev.filter(t => t.id !== (payload.old as Record<string, unknown>).id))
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Load users for assignment dropdowns
  useEffect(() => { refreshUsers() }, [refreshUsers])

  // Load global app settings + subscribe to changes
  useEffect(() => {
    const loadSettings = async () => {
      const { data, error } = await supabase.from('app_settings').select('*').eq('id', 1).single()
      if (!error && data) {
        setSettings({ emailsEnabled: data.emails_enabled ?? true })
      }
    }
    loadSettings()

    const ch = supabase.channel('settings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, (payload) => {
        const row = payload.new as Record<string, unknown>
        if (row) setSettings({ emailsEnabled: (row.emails_enabled as boolean) ?? true })
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => {
    const prev = settings
    const next = { ...settings, ...patch }
    setSettings(next)
    const { error } = await supabase.from('app_settings').upsert({
      id: 1,
      emails_enabled: next.emailsEnabled,
      updated_at: new Date().toISOString(),
    })
    if (error) {
      // revert optimistic update and surface the failure
      setSettings(prev)
      console.error('Failed to save settings:', error)
      throw new Error(error.message)
    }
  }, [settings])

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setCurrentUser(null)
  }, [])

  const visibleTickets = tickets.filter(t => {
    if (!currentUser) return false
    if (currentUser.role === 'contractor_pm' || currentUser.role === 'contractor_employee') {
      return t.contractor === currentUser.contractor
    }
    return true // super_admin, quality_control, viewer see all
  })

  const filteredTickets = visibleTickets.filter(t => {
    if (filters.status !== 'all' && t.status !== filters.status) return false
    if (filters.contractor !== 'all' && t.contractor !== filters.contractor) return false
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false
    if (filters.testPhase === 'none' && t.testPhase) return false
    if (filters.testPhase !== 'all' && filters.testPhase !== 'none' && t.testPhase !== filters.testPhase) return false
    if (filters.assignedTo && t.assignedToId !== filters.assignedTo) return false
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const haystack = [
        t.ticketNumber, t.description, t.contractor,
        t.assignedToName || '', t.status, t.priority,
        t.createdByName, t.testPhase || '',
        t.targetDate || '', t.testDate || '',
      ].join(' ').toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const createTicket = useCallback(async (data: Partial<Ticket>) => {
    if (!currentUser) return
    const now = new Date().toISOString()
    const id = generateId()
    const newTicket: Ticket = {
      id,
      ticketNumber: data.ticketNumber || '',
      contractor: data.contractor || 'TMT',
      status: 'פתוח',
      priority: data.priority || 'בינונית',
      description: data.description || '',
      testPhase: data.testPhase,
      targetDate: data.targetDate,
      testDate: data.testDate,
      assignedToId: data.assignedToId,
      assignedToName: data.assignedToName,
      notes: '',
      createdAt: now,
      updatedAt: now,
      openedAt: now,
      createdByName: currentUser.name,
      createdById: currentUser.id,
      chatMessages: [],
      statusHistory: [{ id: generateId(), ticketId: id, userId: currentUser.id, userName: currentUser.name, oldStatus: 'פתוח', newStatus: 'פתוח', createdAt: now }],
      checklist: data.checklist || [],
    }
    setTickets(prev => [newTicket, ...prev])
    const { error } = await supabase.from('tickets').insert(ticketToRow(newTicket))
    if (error) setTickets(prev => prev.filter(t => t.id !== id))
  }, [currentUser])

  const updateTicket = useCallback(async (id: string, data: Partial<Ticket>) => {
    const now = new Date().toISOString()
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: now } : t))
    const ticket = tickets.find(t => t.id === id)
    if (!ticket) return
    const updated = { ...ticket, ...data, updatedAt: now }
    await supabase.from('tickets').update(ticketToRow(updated)).eq('id', id)
  }, [tickets])

  const deleteTicket = useCallback(async (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
    await supabase.from('tickets').delete().eq('id', id)
  }, [])

  const updateStatus = useCallback(async (id: string, status: Status) => {
    if (!currentUser) return
    const now = new Date().toISOString()
    const ticket = tickets.find(t => t.id === id)
    if (!ticket) return
    const change: StatusChange = { id: generateId(), ticketId: id, userId: currentUser.id, userName: currentUser.name, oldStatus: ticket.status, newStatus: status, createdAt: now }
    const updated = { ...ticket, status, updatedAt: now, closedAt: status === 'סגור' ? now : ticket.closedAt, statusHistory: [...ticket.statusHistory, change] }
    setTickets(prev => prev.map(t => t.id === id ? updated : t))
    await supabase.from('tickets').update(ticketToRow(updated)).eq('id', id)

    // Notify opted-in users of the status change (per-user) — unless emails are paused
    if (settings.emailsEnabled && ticket.status !== status) {
      // Contractor-bound users get only their contractor's tickets; users
      // without a contractor (QC/admin) get all.
      const recipients = users.filter(
        u => u.emailNotifications && u.email && (!u.contractor || u.contractor === ticket.contractor)
      )
      const openNotes = ticket.checklist.filter(it => !it.done).length
      await Promise.all(
        recipients.map(u =>
          sendStatusChangeEmail({
            toEmail: u.email,
            recipientName: u.name,
            ticketNumber: ticket.ticketNumber,
            contractor: ticket.contractor,
            oldStatus: ticket.status,
            newStatus: status,
            changedBy: currentUser.name,
            openNotes,
            totalNotes: ticket.checklist.length,
          })
        )
      )
    }
  }, [currentUser, tickets, users, settings])

  const bulkUpdateStatus = useCallback(async (ids: string[], status: Status) => {
    if (!currentUser) return
    const now = new Date().toISOString()
    const updatedList = tickets.filter(t => ids.includes(t.id)).map(t => {
      const change: StatusChange = { id: generateId(), ticketId: t.id, userId: currentUser.id, userName: currentUser.name, oldStatus: t.status, newStatus: status, createdAt: now }
      return { ...t, status, updatedAt: now, closedAt: status === 'סגור' ? now : t.closedAt, statusHistory: [...t.statusHistory, change] }
    })
    setTickets(prev => prev.map(t => updatedList.find(u => u.id === t.id) || t))
    setSelectedIds([])
    await Promise.all(updatedList.map(t => supabase.from('tickets').update(ticketToRow(t)).eq('id', t.id)))
  }, [currentUser, tickets])

  const addChat = useCallback(async (ticketId: string, message: string) => {
    if (!currentUser) return
    const msg: ChatMessage = { id: generateId(), ticketId, userId: currentUser.id, userName: currentUser.name, userRole: currentUser.role, message, createdAt: new Date().toISOString() }
    const now = new Date().toISOString()
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t
      return { ...t, chatMessages: [...t.chatMessages, msg], updatedAt: now }
    }))
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return
    const newMessages = [...ticket.chatMessages, msg]
    await supabase.from('tickets').update({ chat_messages: newMessages, updated_at: now }).eq('id', ticketId)
  }, [currentUser, tickets])

  const deleteChat = useCallback(async (ticketId: string, messageId: string) => {
    const ticket = tickets.find(t => t.id === ticketId)
    if (!ticket) return
    const newMessages = ticket.chatMessages.filter(m => m.id !== messageId)
    const now = new Date().toISOString()
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, chatMessages: newMessages, updatedAt: now } : t))
    await supabase.from('tickets').update({ chat_messages: newMessages, updated_at: now }).eq('id', ticketId)
  }, [tickets])

  const updateChecklist = useCallback(async (ticketId: string, checklist: import('@/types').ChecklistItem[]) => {
    const now = new Date().toISOString()
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, checklist, updatedAt: now } : t))
    await supabase.from('tickets').update({ checklist, updated_at: now }).eq('id', ticketId)
  }, [])

  // Restore from a backup file — upsert tickets (merge, does not delete existing)
  const importTickets = useCallback(async (incoming: Ticket[]): Promise<number> => {
    const rows = incoming.map(ticketToRow)
    const { error } = await supabase.from('tickets').upsert(rows, { onConflict: 'id' })
    if (error) throw new Error(error.message)
    await fetchTickets()
    return rows.length
  }, [fetchTickets])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }, [])

  const selectAll = useCallback(() => setSelectedIds(filteredTickets.map(t => t.id)), [filteredTickets])
  const clearSelection = useCallback(() => setSelectedIds([]), [])
  const setFilters = useCallback((f: Partial<FilterState>) => setFiltersState(prev => ({ ...prev, ...f })), [])

  return (
    <Ctx.Provider value={{
      currentUser, authLoading, login, logout,
      tickets, filteredTickets, selectedIds, filters, users, ticketsLoading,
      refreshUsers, createTicket, updateTicket, deleteTicket, updateStatus, bulkUpdateStatus,
      addChat, deleteChat, updateChecklist, importTickets, settings, updateSettings, toggleSelect, selectAll, clearSelection, setFilters,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
