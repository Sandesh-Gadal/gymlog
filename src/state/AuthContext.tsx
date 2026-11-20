import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth'
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { firebaseEnabled, getFirebase } from '../data/firebase'

export interface AppUser {
  uid: string
  displayName: string
  photoURL?: string
}

interface AuthState {
  user: AppUser | null
  loading: boolean
  /** 'local' when Firebase is not configured — no sign-in, data stays on device */
  mode: 'firebase' | 'local'
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const LOCAL_USER: AppUser = { uid: 'local', displayName: 'Local' }

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children, forceLocal = false }: { children: ReactNode; forceLocal?: boolean }) {
  const mode = firebaseEnabled && !forceLocal ? 'firebase' : 'local'
  const [user, setUser] = useState<AppUser | null>(mode === 'local' ? LOCAL_USER : null)
  const [loading, setLoading] = useState(mode === 'firebase')

  useEffect(() => {
    if (mode !== 'firebase') return
    const { auth } = getFirebase()
    return onAuthStateChanged(auth, (u) => {
      setUser(u ? { uid: u.uid, displayName: u.displayName ?? 'You', photoURL: u.photoURL ?? undefined } : null)
      setLoading(false)
    })
  }, [mode])

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      mode,
      async signIn() {
        if (mode !== 'firebase') return
        await signInWithPopup(getFirebase().auth, new GoogleAuthProvider())
      },
      async signOut() {
        if (mode !== 'firebase') return
        await fbSignOut(getFirebase().auth)
      },
    }),
    [user, loading, mode],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
