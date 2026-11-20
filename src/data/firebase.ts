import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

/**
 * Firebase is optional: if VITE_FIREBASE_* env vars are missing the app runs in local mode.
 * These values are public identifiers, not secrets — access is enforced by firestore.rules.
 */
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined

export function getFirebase(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (!firebaseEnabled) throw new Error('Firebase is not configured')
  if (!app) {
    app = initializeApp(config)
    auth = getAuth(app)
    // Offline-first: Firestore keeps a full local copy in IndexedDB and syncs when online.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    })
  }
  return { app, auth: auth!, db: db! }
}
