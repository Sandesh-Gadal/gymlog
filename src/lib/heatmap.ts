import { addDays, startOfWeek, toISODate } from './format'
import { workoutVolume } from './pr'
import type { Workout } from './types'

/** 0 = rest day, 1–4 = increasing training volume. */
export type HeatLevel = 0 | 1 | 2 | 3 | 4

export interface HeatCell {
  /** YYYY-MM-DD */
  date: string
  sessions: number
  /** kg, summed over all workouts that day */
  volume: number
  level: HeatLevel
  /** after today: rendered as an empty slot */
  future: boolean
}

export interface Heatmap {
  /** columns, oldest first; each column is Monday → Sunday (7 cells) */
  weeks: HeatCell[][]
  /** days in the window with at least one workout */
  activeDays: number
  sessions: number
}

/**
 * Level for a trained day, relative to the busiest day in the window.
 * Bodyweight-only or cardio days (0 kg volume) still count as trained (level 1).
 */
export function heatLevel(volume: number, maxVolume: number): HeatLevel {
  if (maxVolume <= 0 || volume <= 0) return 1
  return Math.min(4, Math.max(1, Math.ceil((volume / maxVolume) * 4))) as HeatLevel
}

/** GitHub-style grid of the last `weeks` weeks, ending with the week containing `today`. */
export function buildHeatmap(workouts: Workout[], today: Date, weeks = 26): Heatmap {
  const todayISO = toISODate(today)
  const start = addDays(startOfWeek(today), -(weeks - 1) * 7)
  const startISO = toISODate(start)

  const byDate = new Map<string, { sessions: number; volume: number }>()
  for (const w of workouts) {
    if (w.date < startISO || w.date > todayISO) continue
    const d = byDate.get(w.date) ?? { sessions: 0, volume: 0 }
    d.sessions += 1
    d.volume += workoutVolume(w)
    byDate.set(w.date, d)
  }
  const maxVolume = Math.max(0, ...[...byDate.values()].map((d) => d.volume))

  const cols: HeatCell[][] = []
  let sessions = 0
  for (let c = 0; c < weeks; c++) {
    const col: HeatCell[] = []
    for (let r = 0; r < 7; r++) {
      const date = toISODate(addDays(start, c * 7 + r))
      const d = byDate.get(date)
      if (d) sessions += d.sessions
      col.push({
        date,
        sessions: d?.sessions ?? 0,
        volume: d?.volume ?? 0,
        level: d ? heatLevel(d.volume, maxVolume) : 0,
        future: date > todayISO,
      })
    }
    cols.push(col)
  }
  return { weeks: cols, activeDays: byDate.size, sessions }
}
