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

export async function fetchQualityCase(caseNumber: string): Promise<QualityCase | null> {
  try {
    await ensureAuth()
    const q = query(collection(db, 'quality'), where('caseNumber', '==', caseNumber))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const doc = snap.docs[0]
    return { id: doc.id, ...doc.data() } as QualityCase
  } catch {
    return null
  }
}
