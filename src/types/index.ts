export type Contractor = 'TMT' | 'EBS'
export type Status = 'פתוח' | 'בטיפול' | 'ממתין לאישור' | 'סגור'
export type Priority = 'גבוהה' | 'בינונית' | 'נמוכה'
export type TestPhase = 'לפני טסט' | 'אחרי טסט'
export type UserRole = 'super_admin' | 'quality_control' | 'contractor_pm' | 'contractor_employee' | 'viewer'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  contractor?: Contractor
}

export interface ChatMessage {
  id: string
  ticketId: string
  userId: string
  userName: string
  userRole: UserRole
  message: string
  createdAt: string
}

export interface StatusChange {
  id: string
  ticketId: string
  userId: string
  userName: string
  oldStatus: Status
  newStatus: Status
  createdAt: string
}

export interface Ticket {
  id: string
  ticketNumber: string
  contractor: Contractor
  assignedToId?: string
  assignedToName?: string
  status: Status
  priority: Priority
  description: string
  testPhase?: TestPhase
  targetDate?: string
  testDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
  openedAt: string
  closedAt?: string
  chatMessages: ChatMessage[]
  statusHistory: StatusChange[]
  createdByName: string
  createdById: string
}

export interface FilterState {
  search: string
  status: Status | 'all'
  contractor: Contractor | 'all'
  priority: Priority | 'all'
  testPhase: TestPhase | 'all' | 'none'
  assignedTo: string
}
