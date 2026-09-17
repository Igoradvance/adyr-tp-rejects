'use client'
import { useEffect } from 'react'
import { RefreshCw, TriangleAlert } from 'lucide-react'

const CHUNK_RELOAD_KEY = 'tp_chunk_reload'

// Stale-deploy detection: after a new Vercel build, an already-open tab may try
// to load JS/CSS chunks whose hashes no longer exist → the app crashes to a
// blank screen. That's the "white screen until refresh" symptom. Reload once
// automatically; the guard prevents a reload loop if the error persists.
function isStaleChunkError(error: Error): boolean {
  const text = `${error?.name ?? ''} ${error?.message ?? ''}`
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Failed to fetch|Importing a module script failed/i.test(text)
}

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[TP Reject] render error:', error)
    if (!isStaleChunkError(error)) return
    try {
      if (!sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
        sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
        window.location.reload()
      }
    } catch { /* ignore */ }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-navy-50">
      <div className="qt-fade-up bg-white rounded-3xl shadow-lg border border-line w-full max-w-md p-7 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
          <TriangleAlert size={26} strokeWidth={2.2} />
        </div>
        <h1 className="text-lg font-extrabold text-ink mb-1">משהו השתבש בטעינת המסך</h1>
        <p className="text-sm text-ink-muted mb-5">
          {isStaleChunkError(error)
            ? 'כנראה עלתה גרסה חדשה בזמן שהמערכת הייתה פתוחה. רענון יפתור את זה.'
            : 'אפשר לנסות שוב, או לרענן את הדף כדי לטעון את הגרסה העדכנית.'}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="qt-btn inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy-600 text-white text-sm font-bold"
          >
            <RefreshCw size={15} /> רענן את הדף
          </button>
          <button
            onClick={reset}
            className="qt-btn px-4 py-2.5 rounded-xl bg-navy-50 border border-line text-navy-600 text-sm font-bold"
          >
            נסה שוב
          </button>
        </div>
        {error?.digest && <p className="mt-4 text-[10px] text-ink-faint tabular-nums" dir="ltr">ref: {error.digest}</p>}
      </div>
    </div>
  )
}
