'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function Home() {
  const { currentUser, authLoading } = useStore()
  const router = useRouter()

  // Wait for the session check before choosing a destination — otherwise a
  // logged-in user is bounced to /login and back on every cold load.
  useEffect(() => {
    if (authLoading) return
    router.replace(currentUser ? '/dashboard' : '/login')
  }, [currentUser, authLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-9 h-9 border-4 border-navy-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
