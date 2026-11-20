import { useState } from 'react'
import { useAuth } from '../state/AuthContext'

export function SignIn() {
  const { signIn } = useAuth()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const go = async () => {
    setBusy(true)
    setError('')
    try {
      await signIn()
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      setError(
        code === 'auth/popup-blocked'
          ? 'Popup was blocked. Allow popups for this site and try again.'
          : code === 'auth/unauthorized-domain'
            ? 'This domain is not authorised in Firebase (Authentication → Settings → Authorized domains).'
            : code === 'auth/popup-closed-by-user'
              ? ''
              : 'Sign-in failed. Check your connection and try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col items-center justify-center gap-6 px-6 text-center">
      <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" className="size-20 rounded-3xl" />
      <div>
        <h1 className="text-3xl font-black tracking-tight">GYMLOG</h1>
        <p className="mt-1 text-sm text-muted">Log workouts fast. Track PRs automatically. Synced across your devices.</p>
      </div>
      <button type="button" className="btn-primary w-full" onClick={go} disabled={busy}>
        {busy ? 'Signing in…' : 'Continue with Google'}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
      <p className="text-xs text-muted">Your data is private to your Google account and works offline.</p>
    </div>
  )
}
