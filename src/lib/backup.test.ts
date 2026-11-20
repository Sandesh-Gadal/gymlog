import { describe, expect, it } from 'vitest'
import { workout } from '../test/fixtures'
import { BackupError, createBackup, parseBackup } from './backup'
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
})
