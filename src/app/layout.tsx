import type { Metadata, Viewport } from 'next'
import { Heebo } from 'next/font/google'
import './globals.css'
import { StoreProvider } from '@/lib/store'
import AppFooter from '@/components/AppFooter'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-heebo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ADYR TP Reject – ניהול תקלות',
  description: 'ADYR TP Reject — מערכת לניהול תקלות על תיקי קבלנים',
  applicationName: 'ADYR TP Reject',
  appleWebApp: { capable: true, title: 'ADYR TP Reject', statusBarStyle: 'default' },
  manifest: '/manifest.webmanifest',
  // To change the phone/app icon: replace public/app-icon-source.png (square,
  // 1024px) and regenerate the sizes below — see CHANGELOG Build 74.
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="font-sans bg-navy-50 text-ink antialiased">
        <StoreProvider>
          {children}
          <AppFooter />
        </StoreProvider>
      </body>
    </html>
  )
}

