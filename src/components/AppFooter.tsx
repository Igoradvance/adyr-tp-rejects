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
      className="fixed inset-x-0 bottom-0 z-40 flex flex-col items-center justify-center gap-0.5 px-4 pt-2 text-center text-[12px] leading-relaxed text-[#B8C3D1] bg-navy-700 border-t-2 border-teal-600 shadow-[0_-6px_24px_rgba(15,31,51,0.10)]"
      style={{ paddingBottom: 'calc(8px + var(--safe-bottom))' }}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-[#E6ECF3]">
        <span
          aria-hidden="true"
          className="inline-grid place-items-center w-[22px] h-[22px] rounded-md text-white text-[10px] font-extrabold tracking-wide flex-none"
          style={{ background: 'linear-gradient(140deg, #2A9D8F, #1F8A8A)' }}
        >
          IO
        </span>
        <span>
          כל הזכויות שמורות © {new Date().getFullYear()} — <b>{VENDOR_NAME}</b>
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-center text-[11px] text-ink-faint tabular-nums">
        <span>גרסה <span dir="ltr">v{VERSION}</span></span>
        <span className="opacity-55 mx-1.5">·</span>
        <span>בילד <span dir="ltr">{BUILD} · {BUILD_DATE}</span></span>
        <span className="opacity-55 mx-1.5">·</span>
        <button
          type="button"
          onClick={() => { setUpdating(true); refreshApp() }}
          disabled={updating}
          className="qt-footer-btn inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/20 bg-white/10 text-[#B8C3D1] text-[11px] leading-relaxed transition-colors disabled:opacity-60"
        >
          <RefreshCw size={11} className={updating ? 'animate-spin' : ''} />
          <span>{updating ? 'מרענן…' : 'רענון גרסה'}</span>
        </button>
      </div>
    </footer>
  )
}
