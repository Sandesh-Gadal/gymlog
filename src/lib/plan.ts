import { parseISODate } from './format'
import type { Plan, PlanItem, PlanSession } from './types'

/** Mon = 0 … Sun = 6, matching startOfWeek (weeks start Monday). */
export function weekdayIndex(iso: string): number {
  return (parseISODate(iso).getDay() + 6) % 7
}

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/** Session planned for a date, or null for a rest day / no plan. */
export function sessionFor(plan: Plan | null, iso: string): PlanSession | null {
  if (!plan) return null
  const id = plan.week[weekdayIndex(iso)]
  return (id && plan.sessions.find((s) => s.id === id)) || null
}

/** Everything to do on a day: the daily items (mobility) first, then the session. */
export function itemsFor(plan: Plan | null, session: PlanSession | null): PlanItem[] {
  return [...(plan?.daily ?? []), ...(session?.items ?? [])]
}

export function trainingDays(plan: Plan): number {
  return plan.week.filter((id) => id && plan.sessions.some((s) => s.id === id)).length
}

/** Rep target, e.g. "6–10" or "12". */
export function repsHint(item: Pick<PlanItem, 'repsMin' | 'repsMax'>): string {
  return item.repsMax > item.repsMin ? `${item.repsMin}–${item.repsMax}` : String(item.repsMin)
}

/** "4 × 6–10" or "3 × 12" */
export function formatTarget(item: Pick<PlanItem, 'sets' | 'repsMin' | 'repsMax'>): string {
  return `${item.sets} × ${repsHint(item)}`
}

/** Remove a session and turn the days that used it into rest days. */
export function removeSession(plan: Plan, id: string): Plan {
  return { ...plan, sessions: plan.sessions.filter((s) => s.id !== id), week: plan.week.map((w) => (w === id ? null : w)) }
}

export function emptyPlan(now = Date.now()): Plan {
  return { sessions: [], week: [null, null, null, null, null, null, null], daily: [], updatedAt: now }
}

const item = (exerciseId: string, sets: number, repsMin: number, repsMax = repsMin): PlanItem => ({ exerciseId, sets, repsMin, repsMax })

/**
 * Push / Pull / Legs twice a week, rest Saturday, shoulder mobility every day.
 * Week order is Mon…Sun: Pull, Legs, Push, Pull, Legs, Rest, Push.
 */
export function pplTemplate(now = Date.now()): Plan {
  return {
    sessions: [
      {
        id: 'push',
        title: 'Push',
        notes: 'Chest, shoulders, triceps · Rest 60–90 s · Focus: progressive overload',
        items: [
          item('bench-press', 4, 6, 10),
          item('incline-dumbbell-press', 3, 8, 12),
          item('overhead-press', 3, 6, 10),
          item('lateral-raise', 3, 12, 15),
          item('triceps-pushdown', 3, 10, 12),
          item('overhead-triceps-extension', 2, 12, 15),
        ],
      },
      {
        id: 'pull',
        title: 'Pull',
        notes: 'Back, biceps · Rest 60–90 s · Focus: control and squeeze',
        items: [
          item('lat-pulldown', 4, 6, 10),
          item('barbell-row', 3, 8, 12),
          item('seated-cable-row', 3, 10, 12),
          item('face-pull', 3, 12, 15),
          item('barbell-curl', 3, 8, 12),
          item('hammer-curl', 2, 10, 12),
        ],
      },
      {
        id: 'legs',
        title: 'Legs',
        notes: 'Quads, hamstrings, glutes, calves · Rest 90 s · Focus: full range of motion',
        items: [
          item('squat', 4, 6, 10),
          item('romanian-deadlift', 3, 8, 12),
          item('leg-press', 3, 10, 12),
          item('leg-curl', 3, 12),
          item('calf-raise', 4, 15, 20),
          item('hanging-leg-raise', 3, 10, 15),
        ],
      },
    ],
    week: ['pull', 'legs', 'push', 'pull', 'legs', null, 'push'],
    daily: [item('shoulder-pass-through', 2, 10, 15)],
    updatedAt: now,
  }
}
