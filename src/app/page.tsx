'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

export default function Home() {
  const { currentUser } = useStore()
  const router = useRouter()

  useEffect(() => {
    router.replace(currentUser ? '/dashboard' : '/login')
  }, [currentUser, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
