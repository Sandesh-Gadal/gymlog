import { describe, expect, it } from 'vitest'
import { workout } from '../test/fixtures'
import { BADGES, computeAchievements, currentDayStreak, currentWeekStreak, type AchievementInput } from './achievements'

const base: AchievementInput = { workouts: [], prEvents: [], weights: [], startWeightKg: 85, weeklyTarget: 3 }
const get = (input: Partial<AchievementInput>, id: string) => computeAchievements({ ...base, ...input }).find((s) => s.id === id)!

describe('achievements', () => {
  it('badge ids are unique', () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length)
  })

  it('nothing unlocked with no history', () => {
    expect(computeAchievements(base).filter((s) => s.unlocked)).toEqual([])
  })

  it('first workout unlocks First Rep on that workout', () => {
    const w = workout('2026-11-02', { bench: [[40, 10]] })
    expect(get({ workouts: [w] }, 'first-rep').unlocked).toEqual({ date: '2026-11-02', workoutId: w.id })
  })

  it('session volume unlocks on the workout that crossed it, with progress for locked badges', () => {
    const light = workout('2026-11-02', { bench: [[40, 10]] }) // 400 kg
    const heavy = workout('2026-11-03', { squat: [[100, 8], [100, 8]] }) // 1,600 kg
    const input = { workouts: [heavy, light] }
    expect(get(input, 'grand-piano').unlocked?.workoutId).toBe(heavy.id)
    expect(get(input, 'small-car').unlocked?.workoutId).toBe(heavy.id)
    expect(get(input, 'pickup-truck').unlocked).toBeUndefined()
    expect(get(input, 'pickup-truck').progress).toBe(1600)
    expect(get(input, 'double-decker').progress).toBe(2000)
  })

  it('day streak counts consecutive dates, not sessions; a gap resets it', () => {
    const days = ['2026-11-01', '2026-11-02', '2026-11-02', '2026-11-03', '2026-11-05', '2026-11-06']
    const ws = days.map((d) => workout(d, { plank: [[0, 60]] }))
    expect(get({ workouts: ws }, 'on-fire').progress).toBe(3)

    const week = Array.from({ length: 7 }, (_, i) => workout(`2026-11-1${i}`, { plank: [[0, 60]] }))
    expect(get({ workouts: week }, 'on-fire').unlocked?.date).toBe('2026-11-16')
  })

  it('week streak needs consecutive Mon–Sun weeks at the target', () => {
    const mk = (dates: string[]) => dates.map((d) => workout(d, { bench: [[40, 10]] }))
    // weeks of 2, 9, 16, 23 Nov 2026, each with 3 sessions → 4-week streak
    const four = mk(['02', '03', '04', '09', '10', '11', '16', '17', '18', '23', '24', '25'].map((d) => `2026-11-${d}`))
    expect(get({ workouts: four }, 'locked-in').unlocked?.date).toBe('2026-11-25')

    // week of 16 Nov only has 2 → streak broken
    const broken = mk(['02', '03', '04', '09', '10', '11', '16', '17', '23', '24', '25'].map((d) => `2026-11-${d}`))
    expect(get({ workouts: broken }, 'locked-in').unlocked).toBeUndefined()
    expect(get({ workouts: broken }, 'locked-in').progress).toBe(2)
  })

  it('PR count comes from PR events', () => {
    const w = workout('2026-11-02', { bench: [[40, 10]] })
    const ev = { type: 'weight' as const, exerciseId: 'bench', workoutId: w.id, date: w.date, value: 40, previous: 35 }
    expect(get({ workouts: [w], prEvents: [ev] }, 'first-pr').unlocked?.workoutId).toBe(w.id)
  })

  it('body weight badges compare against the start weight', () => {
    const weights = [
      { id: '2026-11-01', date: '2026-11-01', kg: 84, createdAt: 0 },
      { id: '2026-11-10', date: '2026-11-10', kg: 82.9, createdAt: 0 },
    ]
    expect(get({ weights }, 'first-two').unlocked).toEqual({ date: '2026-11-10', workoutId: undefined })
    expect(get({ weights }, 'five-down').progress).toBe(2.1)
  })
})

describe('current streaks', () => {
  const today = new Date(2026, 10, 22) // Sunday

  it('day streak survives until the end of today', () => {
    expect(currentDayStreak(['2026-11-20', '2026-11-21'], today)).toBe(2)
    expect(currentDayStreak(['2026-11-20', '2026-11-21', '2026-11-22'], today)).toBe(3)
    expect(currentDayStreak(['2026-11-19'], today)).toBe(0)
  })

  it('week streak counts this week only once the target is hit', () => {
    const lastTwoWeeks = ['2026-11-09', '2026-11-10', '2026-11-16', '2026-11-17']
    expect(currentWeekStreak(lastTwoWeeks, 2, today)).toBe(2)
    expect(currentWeekStreak([...lastTwoWeeks, '2026-11-02'], 2, today)).toBe(2)
    expect(currentWeekStreak(['2026-11-09', '2026-11-10'], 2, today)).toBe(1) // last week hit, this week not yet
    expect(currentWeekStreak(['2026-11-02', '2026-11-03'], 2, today)).toBe(0) // gap last week
  })
})
