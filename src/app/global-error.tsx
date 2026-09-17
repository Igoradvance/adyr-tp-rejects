'use client'
import { useEffect } from 'react'

const CHUNK_RELOAD_KEY = 'tp_chunk_reload'

// Last-resort boundary (wraps the root layout itself). Must render its own
// <html>/<body>. Same stale-deploy auto-reload as app/error.tsx.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error('[TP Reject] fatal error:', error)
    const text = `${error?.name ?? ''} ${error?.message ?? ''}`
    if (!/ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to fetch/i.test(text)) return
    try {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
        window.location.reload()
      }
    } catch { /* ignore */ }
  }, [error])

  return (
    <html lang="he" dir="rtl">
      <body style={{ margin: 0, background: '#F3F6FA', color: '#0F1F33', fontFamily: "'Heebo','Segoe UI','Arial Hebrew',Arial,sans-serif" }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 14px 40px rgba(15,31,51,0.14)', border: '1px solid #E4EAF2' }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 6px' }}>המערכת נתקלה בשגיאה</h1>
            <p style={{ fontSize: 14, color: '#5B6B80', margin: '0 0 20px' }}>רענון הדף יטען את הגרסה העדכנית.</p>
            <button
              onClick={() => window.location.reload()}
              style={{ background: '#1B3A5C', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              רענן את הדף
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
