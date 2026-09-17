'use client'
import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { VERSION, BUILD, BUILD_DATE } from '@/lib/version'

const VENDOR_NAME = 'IO שירותי תכנון ובניית אתרים בהתאמה אישית'
const CHUNK_RELOAD_KEY = 'tp_chunk_reload'

// Hard refresh: drop any cached assets / service workers and reload the
// current URL with a cache-busting param so the newest deploy is picked up.
async function refreshApp() {
  try {
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map(k => caches.delete(k)))
    }
  } catch { /* ignore */ }
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? []
    await Promise.all(regs.map(r => r.unregister()))
  } catch { /* ignore */ }
  const url = new URL(window.location.href)
  url.searchParams.set('v', String(Date.now()))
  window.location.replace(url.toString())
}

export default function AppFooter() {
  const [updating, setUpdating] = useState(false)

  // A successful mount means the last chunk-error auto-reload (see error.tsx)
  // worked — clear the guard so a future stale-deploy can auto-recover again.
  useEffect(() => {
    try { sessionStorage.removeItem(CHUNK_RELOAD_KEY) } catch { /* ignore */ }
  }, [])

  return (
    <footer
      className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 px-3 pt-1.5 text-center text-[11px] leading-tight text-[#B8C3D1] bg-navy-700 border-t-2 border-teal-600 shadow-[0_-4px_16px_rgba(15,31,51,0.10)]"
      style={{ paddingBottom: 'calc(6px + var(--safe-bottom))' }}
    >
      <span
        aria-hidden="true"
        className="inline-grid place-items-center w-[18px] h-[18px] rounded text-white text-[9px] font-extrabold tracking-wide flex-none"
        style={{ background: 'linear-gradient(140deg, #2A9D8F, #1F8A8A)' }}
      >
        IO
      </span>
      <span className="text-[#E6ECF3]">
        כל הזכויות שמורות © {new Date().getFullYear()} — <b>{VENDOR_NAME}</b>
      </span>
      <span className="opacity-40">|</span>
      <span className="tabular-nums text-ink-faint">
        גרסה <span dir="ltr">v{VERSION}</span>
        <span className="opacity-55 mx-1.5">·</span>
        בילד <span dir="ltr">{BUILD} · {BUILD_DATE}</span>
      </span>
      <button
        type="button"
        onClick={() => { setUpdating(true); refreshApp() }}
        disabled={updating}
        className="qt-footer-btn inline-flex items-center gap-1 px-2 py-px rounded-full border border-white/20 bg-white/10 text-[#B8C3D1] text-[10.5px] transition-colors disabled:opacity-60"
      >
        <RefreshCw size={10} className={updating ? 'animate-spin' : ''} />
        <span>{updating ? 'מרענן…' : 'רענון גרסה'}</span>
      </button>
    </footer>
  )
}

