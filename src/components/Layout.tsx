import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../state/AuthContext'

const NAV = [
  { to: '/', label: 'Home', icon: 'M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z' },
  { to: '/history', label: 'History', icon: 'M12 8v4l3 2M21 12a9 9 0 11-9-9 9 9 0 019 9z' },
  { to: '/log', label: 'Log', icon: 'M12 5v14M5 12h14', primary: true },
  { to: '/exercises', label: 'Exercises', icon: 'M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12' },
  { to: '/profile', label: 'Profile', icon: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0' },
]

export function Layout() {
  const { mode } = useAuth()
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      {mode === 'local' && (
        <div className="bg-surface-2 px-4 py-1.5 text-center text-xs text-muted">
          Local mode: data is stored on this device only. Configure Firebase to sync across devices.
        </div>
      )}
      <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        <Outlet />
      </main>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-xl items-stretch justify-around">
          {NAV.map((n) => (
            <li key={n.to} className="flex-1">
              <NavLink
                to={n.to}
                end={n.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${isActive ? 'text-accent' : 'text-muted'}`
                }
              >
                <span className={n.primary ? 'grid size-9 place-items-center rounded-full bg-accent text-accent-ink' : 'grid size-6 place-items-center'}>
                  <svg viewBox="0 0 24 24" className={n.primary ? 'size-5' : 'size-5'} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d={n.icon} />
                  </svg>
                </span>
                {n.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
