import type { Metadata } from 'next'
import './globals.css'
import { StoreProvider } from '@/lib/store'

export const metadata: Metadata = {
  title: 'TP Reject – ניהול תקלות',
  description: 'מערכת לניהול תקלות על תיקי קבלנים',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  )
}
