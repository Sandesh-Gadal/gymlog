import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getFirebase } from '../data/firebase'
import { createFirestoreRepo } from '../data/firestoreRepo'
import { createLocalRepo } from '../data/localRepo'
import type { Repository } from '../data/repository'
import { mergeExercises } from '../lib/exercises'
import { analyzeHistory, type ExerciseRecords, type PREvent } from '../lib/pr'
import { DEFAULT_PROFILE } from '../lib/profile'
import type { Exercise, Profile, WeightEntry, Workout } from '../lib/types'
import { useAuth } from './AuthContext'

interface DataState {
  repo: Repository
  ready: boolean
  profile: Profile
  workouts: Workout[]
  /** built-in + custom, sorted by name */
  exercises: Exercise[]
  customExercises: Exercise[]
  weights: WeightEntry[]
  prEvents: PREvent[]
  records: Map<string, ExerciseRecords>
  exerciseName: (id: string) => string
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children, repo: injected }: { children: ReactNode; repo?: Repository }) {
  const { user, mode } = useAuth()
  const repo = useMemo<Repository>(() => {
    if (injected) return injected
    if (mode === 'firebase' && user) return createFirestoreRepo(getFirebase().db, user.uid)
    return createLocalRepo()
  }, [injected, mode, user])

  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [customExercises, setCustom] = useState<Exercise[]>([])
  const [weights, setWeights] = useState<WeightEntry[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loaded, setLoaded] = useState({ w: false, e: false, b: false, p: false })

  useEffect(() => {
    // DataProvider is keyed by uid, so the repo is stable for the provider's lifetime.
    const unsubs = [
      repo.watch('workouts', (v) => (setWorkouts(v), setLoaded((l) => ({ ...l, w: true })))),
      repo.watch('exercises', (v) => (setCustom(v), setLoaded((l) => ({ ...l, e: true })))),
      repo.watch('weights', (v) => (setWeights(v), setLoaded((l) => ({ ...l, b: true })))),
      repo.watchProfile((v) => (setProfile(v), setLoaded((l) => ({ ...l, p: true })))),
    ]
    return () => unsubs.forEach((u) => u())
  }, [repo])

  const value = useMemo<DataState>(() => {
    const exercises = mergeExercises(customExercises)
    const names = new Map(exercises.map((e) => [e.id, e.name]))
    const { events, records } = analyzeHistory(workouts)
    return {
      repo,
      ready: loaded.w && loaded.e && loaded.b && loaded.p,
      profile: profile ?? DEFAULT_PROFILE,
      workouts: [...workouts].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt),
      exercises,
      customExercises,
      weights: [...weights].sort((a, b) => b.date.localeCompare(a.date)),
      prEvents: events,
      records,
      exerciseName: (id) => names.get(id) ?? 'Unknown exercise',
    }
  }, [repo, loaded, profile, workouts, customExercises, weights])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataState {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used inside DataProvider')
  return ctx
}
