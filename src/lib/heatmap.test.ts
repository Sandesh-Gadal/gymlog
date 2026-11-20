import { describe, expect, it } from 'vitest'
import { buildHeatmap, heatLevel } from './heatmap'
import type { Workout } from './types'

function workout(date: string, weight: number, reps: number): Workout {
  return { id: `${date}-${weight}`, date, entries: [{ exerciseId: 'bench-press', sets: [{ weight, reps }] }], createdAt: 0, updatedAt: 0 }
}

// Saturday 21 Nov 2026; its week starts Monday 16 Nov
const today = new Date(2026, 10, 21)

describe('heatLevel', () => {
  it('scales volume into 1–4 relative to the max', () => {
    expect(heatLevel(100, 100)).toBe(4)
    expect(heatLevel(76, 100)).toBe(4)
    expect(heatLevel(75, 100)).toBe(3)
    expect(heatLevel(50, 100)).toBe(2)
    expect(heatLevel(1, 100)).toBe(1)
  })
  it('treats 0 kg sessions (bodyweight, cardio) as trained', () => {
    expect(heatLevel(0, 100)).toBe(1)
    expect(heatLevel(0, 0)).toBe(1)
  })
})

describe('buildHeatmap', () => {
  it('builds Monday-first columns ending with the current week', () => {
    const h = buildHeatmap([], today, 26)
    expect(h.weeks).toHaveLength(26)
    expect(h.weeks.every((c) => c.length === 7)).toBe(true)
    expect(h.weeks[0][0].date).toBe('2026-05-25') // Monday, 25 weeks before 16 Nov
    expect(h.weeks[25][0].date).toBe('2026-11-16')
    expect(h.weeks[25][6].date).toBe('2026-11-22')
  })

  it('marks days after today as future', () => {
    const last = buildHeatmap([], today).weeks.at(-1)!
    expect(last.map((c) => c.future)).toEqual([false, false, false, false, false, false, true])
  })

  it('sums multiple workouts on the same day and levels by volume', () => {
    const h = buildHeatmap(
      [workout('2026-11-20', 100, 10), workout('2026-11-20', 100, 10), workout('2026-11-18', 50, 10), workout('2026-11-17', 0, 20)],
      today,
    )
    const week = h.weeks.at(-1)!
    expect(week[4]).toMatchObject({ date: '2026-11-20', sessions: 2, volume: 2000, level: 4 })
    expect(week[2]).toMatchObject({ date: '2026-11-18', volume: 500, level: 1 })
    expect(week[1]).toMatchObject({ date: '2026-11-17', volume: 0, level: 1 })
    expect(week[0].level).toBe(0)
    expect(h.activeDays).toBe(3)
    expect(h.sessions).toBe(4)
  })

  it('ignores workouts outside the window', () => {
    const h = buildHeatmap([workout('2026-01-01', 100, 10), workout('2026-12-01', 100, 10)], today)
    expect(h.activeDays).toBe(0)
    expect(h.weeks.flat().every((c) => c.level === 0)).toBe(true)
  })
})
