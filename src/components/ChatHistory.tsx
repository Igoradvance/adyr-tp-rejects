'use client'
import { useState, useRef, useEffect } from 'react'
import { ChatMessage, UserRole } from '@/types'
import { useStore } from '@/lib/store'
import { formatDateTime, markMessagesRead } from '@/lib/utils'
import { Send, Trash2, MessageSquareText } from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'סופר אדמין',
  quality_control: 'בקרת איכות',
  contractor_pm: 'מנהל פרוייקט',
  contractor_employee: 'עובד קבלן',
  viewer: 'צפייה בלבד',
}

interface Props {
  ticketId: string
  messages: ChatMessage[]
}

export default function ChatHistory({ ticketId, messages }: Props) {
  const { addChat, deleteChat, currentUser } = useStore()
  const [text, setText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(messages.length)

  const isViewer = currentUser?.role === 'viewer'
  const canDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control'

  useEffect(() => {
    // Only scroll the chat box (not the whole modal) and only when a NEW
    // message actually arrived — avoids jumping on background refreshes.
    if (messages.length > prevCountRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
    prevCountRef.current = messages.length
    if (currentUser) markMessagesRead(currentUser.id, ticketId, messages.length)
  }, [messages, currentUser, ticketId])

  const send = () => {
    if (!text.trim()) return
    addChat(ticketId, text.trim())
    setText('')
  }

  const handleDelete = async (msgId: string) => {
    await deleteChat(ticketId, msgId)
    setConfirmDeleteId(null)
  }

  const DeleteControls = ({ id, mine }: { id: string; mine: boolean }) => {
    if (!canDelete) return null
    if (confirmDeleteId === id) {
      return (
        <div className={`flex items-center gap-1 mb-1 ${mine ? 'order-first' : ''}`}>
          <button onClick={() => handleDelete(id)} className="qt-btn text-[11px] px-2 py-0.5 bg-red-600 text-white rounded-full font-bold">מחק</button>
          <button onClick={() => setConfirmDeleteId(null)} className="qt-btn text-[11px] px-2 py-0.5 bg-[#EEF2F7] text-ink-muted rounded-full font-semibold">ביטול</button>
        </div>
      )
    }
    return (
      <button onClick={() => setConfirmDeleteId(id)} className={`mb-1 p-1 text-ink-faint/60 hover:text-red-500 transition-colors ${mine ? 'order-first' : ''}`} aria-label="מחק הודעה">
        <Trash2 size={12} />
      </button>
    )
  }

  return (
    <div>
      <h4 className="flex items-center gap-2 text-[12.5px] font-bold text-[#3B4A5E] mb-2">
        <MessageSquareText size={14} className="text-navy-600" strokeWidth={2.4} />
        היסטוריית תכתובת
        {messages.length > 0 && <span className="text-[11px] text-ink-faint font-semibold tabular-nums">({messages.length})</span>}
      </h4>

      <div className="border-[1.5px] border-line rounded-2xl overflow-hidden bg-white">
        <div ref={scrollRef} className="h-52 overflow-y-auto p-3 space-y-3 bg-[#F8FAFD]">
          {messages.length === 0 ? (
            <p className="text-center text-ink-faint text-sm py-8">אין הודעות עדיין</p>
          ) : (
            messages.map(msg => {
              const isMe = msg.userId === currentUser?.id
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 text-[11px] text-ink-faint">
                    {isMe ? (
                      <>
                        <span className="tabular-nums">{formatDateTime(msg.createdAt)}</span>
                        <span className="font-bold text-ink-muted">{msg.userName}</span>
                        <span>{ROLE_LABELS[msg.userRole]}</span>
                      </>
                    ) : (
                      <>
                        <span>{ROLE_LABELS[msg.userRole]}</span>
                        <span className="font-bold text-ink-muted">{msg.userName}</span>
                        <span className="tabular-nums">{formatDateTime(msg.createdAt)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-end gap-1.5">
                    <DeleteControls id={msg.id} mine={isMe} />
                    <div className={`max-w-[85%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-navy-600 text-white rounded-tl-md'
                        : 'bg-white text-ink border-[1.5px] border-line rounded-tr-md'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {!isViewer ? (
          <div className="border-t border-line flex items-center gap-2 p-2 bg-white">
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder="כתוב הודעה ולחץ Enter..."
              className="flex-1 px-3.5 py-2 text-sm bg-[#F8FAFD] border-[1.5px] border-line rounded-xl"
            />
            <button
              onClick={send}
              disabled={!text.trim()}
              className="qt-btn w-10 h-10 inline-flex items-center justify-center bg-teal-500 text-white rounded-xl flex-shrink-0"
              aria-label="שלח"
            >
              <Send size={16} strokeWidth={2.3} />
            </button>
          </div>
        ) : (
          <div className="border-t border-line p-2 bg-[#F8FAFD] text-center text-[12px] text-ink-faint font-semibold">
            צפייה בלבד — אין אפשרות לשלוח הודעות
          </div>
        )}
      </div>
    </div>
  )
}
