import { addDays, parseISODate, startOfWeek, toISODate } from './format'
import { workoutVolume, type PREvent } from './pr'
import type { WeightEntry, Workout } from './types'

/**
 * Achievements are derived from history (like PRs), never stored. Each badge watches one
 * metric; it unlocks the first time that metric reaches its target while walking history
 * in date order.
 */
export type Metric =
  | 'workouts' // total sessions
  | 'prs' // total PR events
  | 'sessionVolume' // kg in a single workout
  | 'lifetimeVolume' // kg all-time
  | 'dayStreak' // consecutive days with a workout
  | 'weekStreak' // consecutive Mon–Sun weeks hitting the weekly target
  | 'weekSessions' // workouts in a single week
  | 'kgLost' // start weight minus a logged body weight

export interface BadgeDef {
  id: string
  name: string
  emoji: string
  description: string
  metric: Metric
  target: number
  group: BadgeGroup
}

export type BadgeGroup = 'Milestones' | 'Streaks' | 'Strength' | 'Volume' | 'Body'

export interface BadgeStatus extends BadgeDef {
  /** best value of the metric so far (for progress bars) */
  progress: number
  unlocked?: { date: string; workoutId?: string }
}

const b = (id: string, emoji: string, name: string, metric: Metric, target: number, group: BadgeGroup, description: string): BadgeDef => ({
  id,
  emoji,
  name,
  metric,
  target,
  group,
  description,
})

/** Badge ids are stable (like exercise ids); never rename one. */
export const BADGES: BadgeDef[] = [
  b('first-rep', '🏁', 'First Rep', 'workouts', 1, 'Milestones', 'Log your first workout'),
  b('ten-down', '🔟', 'Ten Down', 'workouts', 10, 'Milestones', 'Log 10 workouts'),
  b('half-century', '🎖️', 'Half Century', 'workouts', 50, 'Milestones', 'Log 50 workouts'),
  b('centurion', '🏛️', 'Centurion', 'workouts', 100, 'Milestones', 'Log 100 workouts'),

  b('on-fire', '🔥', 'On Fire', 'dayStreak', 7, 'Streaks', 'Train 7 days in a row (mobility days count)'),
  b('iron-habit', '🧘', 'Iron Habit', 'dayStreak', 30, 'Streaks', 'Train 30 days in a row'),
  b('six-day-grind', '💪', 'Six-Day Grind', 'weekSessions', 6, 'Streaks', 'Log 6 workouts in one week'),
  b('locked-in', '📅', 'Locked In', 'weekStreak', 4, 'Streaks', 'Hit your weekly target 4 weeks in a row'),
  b('unbreakable', '💎', 'Unbreakable', 'weekStreak', 12, 'Streaks', 'Hit your weekly target 12 weeks in a row'),

  b('first-pr', '⭐', 'First PR', 'prs', 1, 'Strength', 'Set your first personal record'),
  b('pr-hunter', '🏆', 'PR Hunter', 'prs', 10, 'Strength', 'Set 10 personal records'),
  b('record-breaker', '👑', 'Record Breaker', 'prs', 50, 'Strength', 'Set 50 personal records'),

  b('grand-piano', '🎹', 'Grand Piano', 'sessionVolume', 500, 'Volume', 'Move 500 kg in one workout'),
  b('small-car', '🚗', 'Small Car', 'sessionVolume', 1500, 'Volume', 'Move 1,500 kg in one workout'),
  b('pickup-truck', '🛻', 'Pickup Truck', 'sessionVolume', 2500, 'Volume', 'Move 2,500 kg in one workout'),
  b('elephant', '🐘', 'Elephant', 'sessionVolume', 6000, 'Volume', 'Move 6,000 kg in one workout'),
  b('t-rex', '🦖', 'T-Rex', 'sessionVolume', 9000, 'Volume', 'Move 9,000 kg in one workout'),
  b('double-decker', '🚌', 'Double-Decker', 'lifetimeVolume', 12_000, 'Volume', 'Move 12 tonnes in total'),
  b('blue-whale', '🐋', 'Blue Whale', 'lifetimeVolume', 150_000, 'Volume', 'Move 150 tonnes in total'),
  b('jumbo-jet', '✈️', 'Jumbo Jet', 'lifetimeVolume', 400_000, 'Volume', 'Move 400 tonnes in total'),

  b('first-two', '📉', 'First Two', 'kgLost', 2, 'Body', 'Weigh 2 kg below your start weight'),
  b('five-down', '🪶', 'Five Down', 'kgLost', 5, 'Body', 'Weigh 5 kg below your start weight'),
  b('transformation', '🦋', 'Transformation', 'kgLost', 10, 'Body', 'Weigh 10 kg below your start weight'),
]

export interface AchievementInput {
  workouts: Workout[]
  prEvents: PREvent[]
  weights: WeightEntry[]
  startWeightKg: number
  /** sessions per week that count as "hitting the target" */
  weeklyTarget: number
}

const weekKey = (iso: string) => toISODate(startOfWeek(parseISODate(iso)))
const nextDay = (iso: string) => toISODate(addDays(parseISODate(iso), 1))

export function computeAchievements({ workouts, prEvents, weights, startWeightKg, weeklyTarget }: AchievementInput): BadgeStatus[] {
  const status = BADGES.map((d): BadgeStatus => ({ ...d, progress: 0 }))
  const bump = (metric: Metric, value: number, date: string, workoutId?: string) => {
    for (const s of status) {
      if (s.metric !== metric) continue
      s.progress = Math.max(s.progress, value)
      if (!s.unlocked && value >= s.target) s.unlocked = { date, workoutId }
    }
  }

  const prsByWorkout = new Map<string, number>()
  for (const e of prEvents) prsByWorkout.set(e.workoutId, (prsByWorkout.get(e.workoutId) ?? 0) + 1)

  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt - b.createdAt)
  const target = Math.max(1, weeklyTarget)
  const weekCount = new Map<string, number>()
  const weekStreakOf = new Map<string, number>()
  let count = 0
  let prs = 0
  let lifetime = 0
  let lastDate = ''
  let streak = 0

  for (const w of sorted) {
    const vol = workoutVolume(w)
    count += 1
    prs += prsByWorkout.get(w.id) ?? 0
    lifetime += vol
    if (w.date !== lastDate) streak = lastDate && nextDay(lastDate) === w.date ? streak + 1 : 1
    lastDate = w.date

    const wk = weekKey(w.date)
    const inWeek = (weekCount.get(wk) ?? 0) + 1
    weekCount.set(wk, inWeek)
    if (inWeek === target) {
      const prevWeek = toISODate(addDays(parseISODate(wk), -7))
      weekStreakOf.set(wk, (weekStreakOf.get(prevWeek) ?? 0) + 1)
    }

    bump('workouts', count, w.date, w.id)
    bump('prs', prs, w.date, w.id)
    bump('sessionVolume', vol, w.date, w.id)
    bump('lifetimeVolume', lifetime, w.date, w.id)
    bump('dayStreak', streak, w.date, w.id)
    bump('weekSessions', inWeek, w.date, w.id)
    bump('weekStreak', weekStreakOf.get(wk) ?? 0, w.date, w.id)
  }

  if (startWeightKg > 0) {
    for (const e of [...weights].sort((a, b) => a.date.localeCompare(b.date))) {
      bump('kgLost', Math.round((startWeightKg - e.kg) * 10) / 10, e.date)
    }
  }
  return status
}

/** Consecutive days with a workout, ending today (or yesterday, so the streak survives until you train). */
export function currentDayStreak(dates: Iterable<string>, today: Date): number {
  const set = new Set(dates)
  let d = set.has(toISODate(today)) ? today : addDays(today, -1)
  let n = 0
  while (set.has(toISODate(d))) {
    n += 1
    d = addDays(d, -1)
  }
  return n
}

/** Consecutive weeks hitting the target, counting this week only once it is hit. */
export function currentWeekStreak(dates: string[], weeklyTarget: number, today: Date): number {
  const perWeek = new Map<string, number>()
  for (const d of dates) perWeek.set(weekKey(d), (perWeek.get(weekKey(d)) ?? 0) + 1)
  const target = Math.max(1, weeklyTarget)
  const hit = (wk: Date) => (perWeek.get(toISODate(wk)) ?? 0) >= target
  let wk = startOfWeek(today)
  if (!hit(wk)) wk = addDays(wk, -7)
  let n = 0
  while (hit(wk)) {
    n += 1
    wk = addDays(wk, -7)
  }
  return n
}
