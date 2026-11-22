import { describe, expect, it } from 'vitest'
import { workout } from '../test/fixtures'
import { BackupError, createBackup, parseBackup } from './backup'
import { pplTemplate } from './plan'
import { DEFAULT_PROFILE } from './profile'

describe('backup', () => {
  const data = {
    profile: DEFAULT_PROFILE,
    workouts: [workout('2026-01-01', { bench: [[40, 10]] })],
    exercises: [{ id: 'custom-x', name: 'X', muscleGroup: 'chest' as const, custom: true, createdAt: 1 }],
    weights: [{ id: '2026-01-01', date: '2026-01-01', kg: 85, createdAt: 1 }],
  }

  it('round-trips through JSON', () => {
    const b = createBackup(data, new Date('2026-01-02T00:00:00Z'))
    const parsed = parseBackup(JSON.parse(JSON.stringify(b)))
    expect(parsed).toEqual(b)
  })

  it.each([
    [null, 'Not a GYMLOG backup file.'],
    [{ app: 'other' }, 'Not a GYMLOG backup file.'],
    [{ app: 'gymlog', version: 2 }, 'Unsupported backup version: 2'],
    [{ app: 'gymlog', version: 1, workouts: [], exercises: [] }, 'Backup is missing "weights".'],
  ])('rejects %j', (input, message) => {
    expect(() => parseBackup(input)).toThrowError(new BackupError(message))
  })

  it('rejects malformed sets', () => {
    const b = createBackup(data) as unknown as { workouts: { entries: { sets: unknown[] }[] }[] }
    b.workouts[0].entries[0].sets = [{ weight: 'heavy', reps: 10 }]
    expect(() => parseBackup(b)).toThrow('Workout #1 has a malformed set.')
  })

  it('round-trips a weekly plan', () => {
    const b = createBackup({ ...data, workouts: [], plan: pplTemplate(1) })
    expect(parseBackup(JSON.parse(JSON.stringify(b))).plan).toEqual(pplTemplate(1))
  })

  it('accepts backups made before the planner (no plan field)', () => {
    const b = createBackup({ ...data, workouts: [] }) as unknown as Record<string, unknown>
    delete b.plan
    expect(parseBackup(b).plan).toBeNull()
  })

  it('rejects a malformed plan', () => {
    const plan = pplTemplate(1) as unknown as { week: unknown[] }
    plan.week = plan.week.slice(0, 5)
    expect(() => parseBackup({ ...createBackup({ ...data, workouts: [] }), plan })).toThrow('Weekly plan has a malformed week.')
  })
})
