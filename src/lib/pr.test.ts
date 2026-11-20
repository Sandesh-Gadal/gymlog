import { describe, expect, it } from 'vitest'
import { workout } from '../test/fixtures'
import { analyzeHistory, describePR, estimate1RM, prsForWorkout, workoutVolume } from './pr'

const types = (events: { type: string }[]) => events.map((e) => e.type).sort()

describe('estimate1RM (Epley)', () => {
  it('returns the weight itself for a single rep', () => {
    expect(estimate1RM(100, 1)).toBe(100)
  })
  it('applies w × (1 + reps/30)', () => {
    expect(estimate1RM(100, 10)).toBe(133.3)
    expect(estimate1RM(40, 10)).toBe(53.3)
  })
  it('is 0 for bodyweight or zero reps', () => {
    expect(estimate1RM(0, 10)).toBe(0)
    expect(estimate1RM(50, 0)).toBe(0)
  })
})

describe('PR detection', () => {
  it('does not flag the first ever session (baseline)', () => {
    const { events, records } = analyzeHistory([workout('2026-01-01', { bench: [[30, 12], [35, 10]] })])
    expect(events).toEqual([])
    expect(records.get('bench')?.maxWeight).toBe(35)
  })

  it('brief example: previous best 35×10, now 30×12, 35×10, 40×10 → new weight PR', () => {
    const prev = workout('2026-01-01', { bench: [[35, 10]] })
    const now = workout('2026-01-03', { bench: [[30, 12], [35, 10], [40, 10]] })
    const prs = prsForWorkout(now, [prev, now])
    const weight = prs.find((e) => e.type === 'weight')
    expect(weight).toMatchObject({ value: 40, previous: 35, set: { weight: 40, reps: 10 } })
    expect(types(prs)).toEqual(['e1rm', 'volume', 'weight'])
  })

  it('detects a rep PR at a weight already lifted', () => {
    const a = workout('2026-01-01', { bench: [[40, 8]] })
    const b = workout('2026-01-03', { bench: [[40, 10]] })
    const prs = prsForWorkout(b, [a, b])
    expect(prs.find((e) => e.type === 'reps')).toMatchObject({ value: 10, previous: 8 })
    expect(prs.some((e) => e.type === 'weight')).toBe(false)
  })

  it('rep PR also has to beat reps done at heavier weights', () => {
    const a = workout('2026-01-01', { bench: [[40, 6], [45, 8]] })
    const b = workout('2026-01-03', { bench: [[40, 8]] })
    expect(prsForWorkout(b, [a, b]).some((e) => e.type === 'reps')).toBe(false)
    const c = workout('2026-01-05', { bench: [[40, 9]] })
    expect(prsForWorkout(c, [a, b, c]).find((e) => e.type === 'reps')).toMatchObject({ value: 9, previous: 8 })
  })

  it('lighter, never-used weights (warm-ups) do not create rep PRs', () => {
    const a = workout('2026-01-01', { bench: [[35, 10]] })
    const b = workout('2026-01-03', { bench: [[20, 15], [35, 10]] })
    // Volume still counts every set, so only the volume PR fires.
    expect(types(prsForWorkout(b, [a, b]))).toEqual(['volume'])
  })

  it('detects a volume PR without other PRs', () => {
    const a = workout('2026-01-01', { bench: [[40, 10], [40, 10]] })
    const b = workout('2026-01-03', { bench: [[40, 10], [40, 10], [40, 10]] })
    expect(types(prsForWorkout(b, [a, b]))).toEqual(['volume'])
  })

  it('detects an e1RM PR without a weight PR (lighter but many more reps)', () => {
    const a = workout('2026-01-01', { bench: [[60, 3]] }) // e1RM 66
    const b = workout('2026-01-03', { bench: [[55, 8]] }) // e1RM 69.7
    const prs = prsForWorkout(b, [a, b])
    expect(prs.find((e) => e.type === 'e1rm')).toMatchObject({ value: 69.7, previous: 66 })
    expect(prs.some((e) => e.type === 'weight')).toBe(false)
  })

  it('equal performance is not a PR', () => {
    const a = workout('2026-01-01', { bench: [[40, 10]] })
    const b = workout('2026-01-03', { bench: [[40, 10]] })
    expect(prsForWorkout(b, [a, b])).toEqual([])
  })

  it('evaluates chronologically regardless of input order (back-dated logs)', () => {
    const later = workout('2026-02-01', { squat: [[100, 5]] })
    const earlier = workout('2026-01-01', { squat: [[80, 5]] })
    const { events } = analyzeHistory([later, earlier])
    expect(events.find((e) => e.type === 'weight')).toMatchObject({ workoutId: later.id, value: 100, previous: 80 })
  })

  it('tracks exercises independently', () => {
    const a = workout('2026-01-01', { bench: [[40, 10]], squat: [[100, 5]] })
    const b = workout('2026-01-03', { bench: [[45, 10]], squat: [[90, 5]] })
    const prs = prsForWorkout(b, [a, b])
    expect(prs.every((e) => e.exerciseId === 'bench')).toBe(true)
  })

  it('merges duplicate entries of the same exercise in one workout', () => {
    const a = workout('2026-01-01', { bench: [[40, 10], [40, 10]] })
    const b: ReturnType<typeof workout> = {
      ...workout('2026-01-03', {}),
      entries: [
        { exerciseId: 'bench', sets: [{ weight: 40, reps: 10 }] },
        { exerciseId: 'bench', sets: [{ weight: 40, reps: 10 }, { weight: 40, reps: 10 }] },
      ],
    }
    expect(types(prsForWorkout(b, [a, b]))).toEqual(['volume'])
  })

  it('ignores sets with zero reps', () => {
    const a = workout('2026-01-01', { bench: [[40, 10]] })
    const b = workout('2026-01-03', { bench: [[100, 0]] })
    expect(prsForWorkout(b, [a, b])).toEqual([])
  })

  it('bodyweight exercises get rep PRs only', () => {
    const a = workout('2026-01-01', { 'pull-up': [[0, 8]] })
    const b = workout('2026-01-03', { 'pull-up': [[0, 10]] })
    expect(types(prsForWorkout(b, [a, b]))).toEqual(['reps'])
  })

  it('editing a workout re-evaluates against earlier history only', () => {
    const a = workout('2026-01-01', { bench: [[40, 10]] }, 'a')
    const b = workout('2026-01-03', { bench: [[50, 5]] }, 'b')
    const bEdited = { ...b, entries: [{ exerciseId: 'bench', sets: [{ weight: 35, reps: 5 }] }] }
    expect(prsForWorkout(bEdited, [a, b])).toEqual([])
  })
})

describe('helpers', () => {
  it('workoutVolume sums weight × reps across exercises', () => {
    expect(workoutVolume(workout('2026-01-01', { bench: [[40, 10]], squat: [[100, 5]] }))).toBe(900)
  })
  it('describePR renders readable text', () => {
    const a = workout('2026-01-01', { bench: [[35, 10]] })
    const b = workout('2026-01-03', { bench: [[40, 10]] })
    const w = prsForWorkout(b, [a, b]).find((e) => e.type === 'weight')!
    expect(describePR(w)).toBe('40 kg × 10 (prev 35 kg)')
  })
})
