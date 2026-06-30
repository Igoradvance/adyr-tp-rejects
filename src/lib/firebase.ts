import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore'
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
  id: string
  caseNumber: string
  status: string
  assignee: string
  contractor: string
  testType: string
  waterBar: string
  createdAt: string
  history: { at: string; status: string; assignee: string; note: string; by: string }[]
}

export async function fetchQualityCase(caseNumber: string): Promise<{ data: QualityCase | null; error: string | null; allCases?: string[] }> {
  try {
    await ensureAuth()
    const q = query(collection(db, 'quality'), where('caseNumber', '==', caseNumber))
    const snap = await getDocs(q)
    if (snap.empty) {
      // fetch first 5 to debug field names
      const allSnap = await getDocs(collection(db, 'quality'))
      const allCases = allSnap.docs.slice(0, 5).map(d => JSON.stringify(d.data()).slice(0, 120))
      return { data: null, error: null, allCases }
    }
    const doc = snap.docs[0]
    return { data: { id: doc.id, ...doc.data() } as QualityCase, error: null }
  } catch (e) {
    return { data: null, error: String(e) }
  }
}
