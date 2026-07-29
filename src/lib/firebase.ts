import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDO4fXWS_hvXVCZqW5_auv-bK6ABzaBrmM',
  authDomain: 'quality-tracker-89a77.firebaseapp.com',
  projectId: 'quality-tracker-89a77',
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)

let authReady = false
async function ensureAuth() {
  if (authReady) return
  if (!auth.currentUser) await signInAnonymously(auth)
  authReady = true
}

export interface QualityCase {
  caseNumber: string
  status: string
  assignee: string
  contractor: string
  testType: string
  waterBar: string
  createdAt?: string
  history?: { at: string; status: string; assignee: string; note: string; by: string }[]
}

export interface FetchResult {
  data: QualityCase | null
  matchesByNumber?: { contractor: string; status: string }[]
  error?: string
}

// ---------------------------------------------------------------------------
// In-memory cache: all cases snapshot, refreshed at most every 60 seconds.
// A single collection read serves every panel open within that window.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 60_000
let cachedCases: QualityCase[] | null = null
let cacheExpiry = 0

async function getAllCases(): Promise<QualityCase[]> {
  if (cachedCases && Date.now() < cacheExpiry) return cachedCases

  await ensureAuth()
  const snap = await getDocs(collection(db, 'cases'))
  const allCases: QualityCase[] = []
  for (const doc of snap.docs) {
    const data = doc.data()
    if (Array.isArray(data.cases)) allCases.push(...(data.cases as QualityCase[]))
    if (data.caseNumber) allCases.push(data as QualityCase)
  }

  cachedCases = allCases
  cacheExpiry = Date.now() + CACHE_TTL_MS
  return allCases
}

export async function fetchQualityCase(caseNumber: string, contractor: string): Promise<FetchResult> {
  try {
    const allCases = await getAllCases()
    const matchesByNumber: { contractor: string; status: string }[] = []

    const exact = allCases.find(
      c => c.caseNumber === caseNumber && c.contractor?.toUpperCase() === contractor?.toUpperCase()
    )
    if (exact) return { data: exact }

    for (const c of allCases) {
      if (c.caseNumber === caseNumber) {
        matchesByNumber.push({ contractor: c.contractor || '—', status: c.status || '—' })
      }
    }

    return { data: null, matchesByNumber }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}

// Allow the refresh button in QualityTrackerPanel to force a fresh fetch
export function invalidateQualityCache() {
  cacheExpiry = 0
}
