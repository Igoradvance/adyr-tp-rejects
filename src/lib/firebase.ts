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
  // debug: all cases that match caseNumber regardless of contractor
  matchesByNumber?: { contractor: string; status: string }[]
  error?: string
}

export async function fetchQualityCase(caseNumber: string, contractor: string): Promise<FetchResult> {
  try {
    await ensureAuth()
    const snap = await getDocs(collection(db, 'cases'))
    const matchesByNumber: { contractor: string; status: string }[] = []

    const allCases: QualityCase[] = []
    for (const doc of snap.docs) {
      const data = doc.data()
      // each doc is a single case; also support legacy nested { cases: [...] }
      if (Array.isArray(data.cases)) allCases.push(...(data.cases as QualityCase[]))
      if (data.caseNumber) allCases.push(data as QualityCase)
    }

    // exact match: caseNumber + contractor
    const exact = allCases.find(
      c => c.caseNumber === caseNumber && c.contractor?.toUpperCase() === contractor?.toUpperCase()
    )
    if (exact) return { data: exact }

    // collect same-number cases for diagnostics / fallback
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
