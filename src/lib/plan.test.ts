import { describe, expect, it } from 'vitest'
import { BUILT_IN_EXERCISES } from './exercises'
import { formatTarget, itemsFor, pplTemplate, removeSession, repsHint, sessionFor, trainingDays, weekdayIndex } from './plan'
import { entriesFromPlan } from './workoutForm'

const plan = pplTemplate(1)

describe('plan', () => {
  it('weekdayIndex is Monday-first', () => {
    expect(weekdayIndex('2026-11-23')).toBe(0) // Monday
    expect(weekdayIndex('2026-11-22')).toBe(6) // Sunday
  })

  it('PPL template: Push Sun/Wed, Pull Mon/Thu, Legs Tue/Fri, rest Saturday', () => {
    const titles = ['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27', '2026-11-28'].map(
      (d) => sessionFor(plan, d)?.title ?? 'Rest',
    )
    expect(titles).toEqual(['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest'])
    expect(trainingDays(plan)).toBe(6)
  })

  it('template only uses built-in exercises', () => {
    const ids = new Set(BUILT_IN_EXERCISES.map((e) => e.id))
    const used = [...plan.daily, ...plan.sessions.flatMap((s) => s.items)].map((i) => i.exerciseId)
    expect(used.filter((id) => !ids.has(id))).toEqual([])
  })

  it('daily items come first, rest days get only daily items', () => {
    const push = sessionFor(plan, '2026-11-22')
    expect(itemsFor(plan, push)[0].exerciseId).toBe('shoulder-pass-through')
    expect(itemsFor(plan, push)).toHaveLength(7)
    expect(itemsFor(plan, null).map((i) => i.exerciseId)).toEqual(['shoulder-pass-through'])
    expect(sessionFor(null, '2026-11-22')).toBeNull()
  })

  it('removing a session turns its days into rest days', () => {
    const p = removeSession(plan, 'push')
    expect(p.sessions.map((s) => s.id)).toEqual(['pull', 'legs'])
    expect(p.week).toEqual(['pull', 'legs', null, 'pull', 'legs', null, null])
  })

  it('formats targets', () => {
    expect(formatTarget({ sets: 4, repsMin: 6, repsMax: 10 })).toBe('4 × 6–10')
    expect(formatTarget({ sets: 3, repsMin: 12, repsMax: 12 })).toBe('3 × 12')
    expect(repsHint({ repsMin: 15, repsMax: 20 })).toBe('15–20')
  })
})

describe('entriesFromPlan', () => {
  let n = 0
  const key = () => `k${++n}`

  it('one row per planned set, weights from last session, reps left empty', () => {
    const last = new Map([['bench-press', [{ weight: 40, reps: 10 }, { weight: 45, reps: 8 }]]])
    const [e] = entriesFromPlan([{ exerciseId: 'bench-press', sets: 4, repsMin: 6, repsMax: 10 }], (id) => last.get(id), key)
    expect(e.sets).toEqual([
      { weight: '40', reps: '' },
      { weight: '45', reps: '' },
      { weight: '45', reps: '' },
      { weight: '45', reps: '' },
    ])
  })

  it('blank weights for new exercises and no duplicate exercises', () => {
    const items = [
      { exerciseId: 'squat', sets: 2, repsMin: 5, repsMax: 5 },
      { exerciseId: 'squat', sets: 3, repsMin: 8, repsMax: 8 },
    ]
    const entries = entriesFromPlan(items, () => undefined, key)
    expect(entries).toHaveLength(1)
    expect(entries[0].sets).toEqual([
      { weight: '', reps: '' },
      { weight: '', reps: '' },
    ])
  })
})
