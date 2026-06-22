'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  Ticket, User, Status, Priority, FilterState,
  ChatMessage, StatusChange, Contractor, TestPhase,
} from '@/types'
import { MOCK_USERS, INITIAL_TICKETS } from './mockData'
import { supabase, rowToTicket, ticketToRow } from './supabase'
import { generateId } from './utils'

interface StoreContextType {
  currentUser: User | null
  login: (userId: string) => void
  logout: () => void
  tickets: Ticket[]
  filteredTickets: Ticket[]
  selectedIds: string[]
  filters: FilterState
  users: User[]
  loading: boolean
  createTicket: (data: Partial<Ticket>) => Promise<void>
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  updateStatus: (id: string, status: Status) => Promise<void>
  bulkUpdateStatus: (ids: string[], status: Status) => Promise<void>
  addChat: (ticketId: string, message: string) => Promise<void>
  toggleSelect: (id: string) => void
  selectAll: () => void
  clearSelection: () => void
  setFilters: (f: Partial<FilterState>) => void
}

const Ctx = createContext<StoreContextType | null>(null)
const USER_KEY = 'tp_user'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFiltersState] = useState<FilterState>({
    search: '',
    status: 'all',
    contractor: 'all',
    priority: 'all',
    testPhase: 'all',
    assignedTo: '',
  })

  // Load user from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      if (stored) setCurrentUser(JSON.parse(stored))
    } catch {}
  }, [])

  // Fetch tickets from Supabase
  const fetchTickets = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('opened_at', { ascending: false })

    if (error) {
      console.error('Error fetching tickets:', error)
      // Fallback to initial data if DB is empty or error
      setTickets(INITIAL_TICKETS)
    } else if (data && data.length > 0) {
      setTickets(data.map(rowToTicket))
    } else {
      // DB is empty — seed with initial data
      await seedInitialData()
    }
    setLoading(false)
  }, [])

  const seedInitialData = async () => {
    const rows = INITIAL_TICKETS.map(ticketToRow)
    const { error } = await supabase.from('tickets').insert(rows)
    if (!error) setTickets(INITIAL_TICKETS)
    else setTickets(INITIAL_TICKETS) // show locally even if insert fails
  }

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('tickets-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchTickets])

  const login = useCallback((userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId)
    if (user) {
      setCurrentUser(user)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    }
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    localStorage.removeItem(USER_KEY)
  }, [])

  const visibleTickets = tickets.filter(t => {
    if (!currentUser) return false
    if (currentUser.role === 'contractor_pm' || currentUser.role === 'contractor_employee') {
      return t.contractor === currentUser.contractor
    }
    return true
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
        t.notes || '', t.createdByName, t.testPhase || '',
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
      statusHistory: [{
        id: generateId(), ticketId: id,
        userId: currentUser.id, userName: currentUser.name,
        oldStatus: 'פתוח', newStatus: 'פתוח', createdAt: now,
      }],
    }
    // Optimistic update
    setTickets(prev => [newTicket, ...prev])
    const { error } = await supabase.from('tickets').insert(ticketToRow(newTicket))
    if (error) {
      console.error('Create error:', error)
      setTickets(prev => prev.filter(t => t.id !== id))
    }
  }, [currentUser])

  const updateTicket = useCallback(async (id: string, data: Partial<Ticket>) => {
    const now = new Date().toISOString()
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...data, updatedAt: now } : t))

    const ticket = tickets.find(t => t.id === id)
    if (!ticket) return
    const updated = { ...ticket, ...data, updatedAt: now }

    const row = ticketToRow(updated)
    const { error } = await supabase.from('tickets').update(row).eq('id', id)
    if (error) console.error('Update error:', error)
  }, [tickets])

  const deleteTicket = useCallback(async (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
    const { error } = await supabase.from('tickets').delete().eq('id', id)
    if (error) console.error('Delete error:', error)
  }, [])

  const updateStatus = useCallback(async (id: string, status: Status) => {
    if (!currentUser) return
    const now = new Date().toISOString()
    setTickets(prev => prev.map(t => {
      if (t.id !== id) return t
      const change: StatusChange = {
        id: generateId(), ticketId: id,
        userId: currentUser.id, userName: currentUser.name,
        oldStatus: t.status, newStatus: status, createdAt: now,
      }
      const updated = {
        ...t, status, updatedAt: now,
        closedAt: status === 'סגור' ? now : t.closedAt,
        statusHistory: [...t.statusHistory, change],
      }
      supabase.from('tickets').update(ticketToRow(updated)).eq('id', id)
        .then(({ error }) => { if (error) console.error('Status update error:', error) })
      return updated
    }))
  }, [currentUser])

  const bulkUpdateStatus = useCallback(async (ids: string[], status: Status) => {
    if (!currentUser) return
    const now = new Date().toISOString()
    const updated = tickets.filter(t => ids.includes(t.id)).map(t => {
      const change: StatusChange = {
        id: generateId(), ticketId: t.id,
        userId: currentUser.id, userName: currentUser.name,
        oldStatus: t.status, newStatus: status, createdAt: now,
      }
      return {
        ...t, status, updatedAt: now,
        closedAt: status === 'סגור' ? now : t.closedAt,
        statusHistory: [...t.statusHistory, change],
      }
    })
    setTickets(prev => prev.map(t => updated.find(u => u.id === t.id) || t))
    setSelectedIds([])
    await Promise.all(updated.map(t =>
      supabase.from('tickets').update(ticketToRow(t)).eq('id', t.id)
    ))
  }, [currentUser, tickets])

  const addChat = useCallback(async (ticketId: string, message: string) => {
    if (!currentUser) return
    const msg: ChatMessage = {
      id: generateId(), ticketId,
      userId: currentUser.id, userName: currentUser.name,
      userRole: currentUser.role, message,
      createdAt: new Date().toISOString(),
    }
    setTickets(prev => prev.map(t => {
      if (t.id !== ticketId) return t
      const updated = {
        ...t,
        chatMessages: [...t.chatMessages, msg],
        updatedAt: new Date().toISOString(),
      }
      supabase.from('tickets')
        .update({ chat_messages: updated.chatMessages, updated_at: updated.updatedAt })
        .eq('id', ticketId)
        .then(({ error }) => { if (error) console.error('Chat error:', error) })
      return updated
    }))
  }, [currentUser])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }, [])

  const selectAll = useCallback(() => setSelectedIds(filteredTickets.map(t => t.id)), [filteredTickets])
  const clearSelection = useCallback(() => setSelectedIds([]), [])
  const setFilters = useCallback((f: Partial<FilterState>) => setFiltersState(prev => ({ ...prev, ...f })), [])

  return (
    <Ctx.Provider value={{
      currentUser, login, logout,
      tickets, filteredTickets, selectedIds, filters, users: MOCK_USERS, loading,
      createTicket, updateTicket, deleteTicket, updateStatus, bulkUpdateStatus,
      addChat, toggleSelect, selectAll, clearSelection, setFilters,
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
