import { HashRouter, Route, Routes } from 'react-router'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { ExerciseDetail } from './pages/ExerciseDetail'
import { Exercises } from './pages/Exercises'
import { History } from './pages/History'
import { LogWorkout } from './pages/LogWorkout'
import { Profile } from './pages/Profile'
import { SignIn } from './pages/SignIn'
import { Weight } from './pages/Weight'
import { WorkoutView } from './pages/WorkoutView'
import { useAuth } from './state/AuthContext'
import { DataProvider } from './state/DataContext'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="log" element={<LogWorkout />} />
        <Route path="history" element={<History />} />
        <Route path="workout/:id" element={<WorkoutView />} />
        <Route path="workout/:id/edit" element={<LogWorkout />} />
        <Route path="exercises" element={<Exercises />} />
        <Route path="exercises/:id" element={<ExerciseDetail />} />
        <Route path="weight" element={<Weight />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  )
}

/** HashRouter: GitHub Pages has no SPA fallback, so `#/route` URLs avoid 404s on refresh. */
export default function App() {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>
  if (!user) return <SignIn />
  return (
    <DataProvider key={user.uid}>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </DataProvider>
  )
}
