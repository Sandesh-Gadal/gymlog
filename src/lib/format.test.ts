import { describe, expect, it } from 'vitest'
import { mergeExercises } from './exercises'
import { addDays, fmtKg, slugify, startOfWeek, toISODate } from './format'
import { bmi } from './profile'

describe('dates', () => {
  it('weeks start on Monday', () => {
    expect(toISODate(startOfWeek(new Date(2026, 10, 22)))).toBe('2026-11-16') // Sunday
    expect(toISODate(startOfWeek(new Date(2026, 10, 16)))).toBe('2026-11-16') // Monday
  })
  it('addDays crosses month boundaries', () => {
    expect(toISODate(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01')
  })
})

describe('misc', () => {
  it('slugify', () => expect(slugify(' Machine Chest-Press! ')).toBe('machine-chest-press'))
  it('fmtKg', () => {
    expect(fmtKg(40)).toBe('40')
    expect(fmtKg(42.5)).toBe('42.5')
  })
  it('bmi', () => expect(bmi(85, 179)).toBe(26.5))
  it('custom exercises merge with built-ins', () => {
    const all = mergeExercises([{ id: 'custom-a', name: 'AAA Press', muscleGroup: 'chest', custom: true, createdAt: 1 }])
    expect(all[0].name).toBe('AAA Press')
    expect(all.some((e) => e.id === 'bench-press')).toBe(true)
  })
})
