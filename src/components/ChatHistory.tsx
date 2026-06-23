'use client'
import { useState, useRef, useEffect } from 'react'
import { ChatMessage, UserRole } from '@/types'
import { useStore } from '@/lib/store'
import { formatDateTime, markMessagesRead } from '@/lib/utils'
import { Send, Trash2 } from 'lucide-react'

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'סופר אדמין',
  quality_control: 'בקרת איכות',
  contractor_pm: 'מנהל פרוייקט',
  contractor_employee: 'עובד קבלן',
}

interface Props {
  ticketId: string
  messages: ChatMessage[]
}

export default function ChatHistory({ ticketId, messages }: Props) {
  const { addChat, deleteChat, currentUser } = useStore()
  const [text, setText] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const canDelete = currentUser?.role === 'super_admin' || currentUser?.role === 'quality_control'

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  return (
    <div>
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">היסטוריית תכתובת</h4>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="h-52 overflow-y-auto p-3 space-y-3 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">אין הודעות עדיין</p>
          ) : (
            messages.map(msg => {
              const isMe = msg.userId === currentUser?.id
              const isConfirming = confirmDeleteId === msg.id
              return (
                <div key={msg.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {isMe ? (
                      <>
                        <span>{formatDateTime(msg.createdAt)}</span>
                        <span className="font-medium text-gray-600">{msg.userName}</span>
                        <span className="text-gray-400">{ROLE_LABELS[msg.userRole]}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-400">{ROLE_LABELS[msg.userRole]}</span>
                        <span className="font-medium text-gray-600">{msg.userName}</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-end gap-1.5">
                    {canDelete && !isMe && (
                      isConfirming ? (
                        <div className="flex items-center gap-1 mb-1">
                          <button onClick={() => handleDelete(msg.id)} className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-lg hover:bg-red-600">מחק</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">ביטול</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(msg.id)} className="mb-1 p-1 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 size={12} />
                        </button>
                      )
                    )}
                    {canDelete && isMe && (
                      isConfirming ? (
                        <div className="flex items-center gap-1 mb-1 order-first">
                          <button onClick={() => setConfirmDeleteId(null)} className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300">ביטול</button>
                          <button onClick={() => handleDelete(msg.id)} className="text-xs px-2 py-0.5 bg-red-500 text-white rounded-lg hover:bg-red-600">מחק</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDeleteId(msg.id)} className="mb-1 p-1 text-gray-300 hover:text-red-400 transition-colors order-first">
                          <Trash2 size={12} />
                        </button>
                      )
                    )}
                    <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tl-sm'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tr-sm'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-200 flex items-center gap-2 p-2 bg-white">
          <input
            type="text"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="כתוב הודעה ולחץ Enter..."
            className="flex-1 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-40 hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
