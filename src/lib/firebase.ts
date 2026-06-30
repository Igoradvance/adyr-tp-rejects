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

export async function fetchQualityCase(caseNumber: string, contractor: string): Promise<QualityCase | null> {
  try {
    await ensureAuth()
    const snap = await getDocs(collection(db, 'quality'))
    for (const doc of snap.docs) {
      const data = doc.data()
      if (Array.isArray(data.cases)) {
        const found = data.cases.find(
          (c: QualityCase) =>
            c.caseNumber === caseNumber &&
            c.contractor?.toUpperCase() === contractor?.toUpperCase()
        )
        if (found) return found
      }
      if (
        data.caseNumber === caseNumber &&
        data.contractor?.toUpperCase() === contractor?.toUpperCase()
      ) return data as QualityCase
    }
    return null
  } catch {
    return null
  }
}
