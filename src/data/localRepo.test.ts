import { describe, expect, it, vi } from 'vitest'
import { workout } from '../test/fixtures'
import { createLocalRepo } from './localRepo'

describe('localRepo', () => {
  it('emits current value on watch and on every change', async () => {
    const repo = createLocalRepo(localStorage, 't:')
    const cb = vi.fn()
    const stop = repo.watch('workouts', cb)
    expect(cb).toHaveBeenLastCalledWith([])

    const w = workout('2026-01-01', { bench: [[40, 10]] })
    await repo.put('workouts', w)
    expect(cb).toHaveBeenLastCalledWith([w])

    await repo.put('workouts', { ...w, notes: 'edited' })
    expect(cb.mock.lastCall![0]).toHaveLength(1)
    expect(cb.mock.lastCall![0][0].notes).toBe('edited')

    await repo.remove('workouts', w.id)
    expect(cb).toHaveBeenLastCalledWith([])
    stop()
  })

  it('persists across instances', async () => {
    await createLocalRepo(localStorage, 'p:').put('weights', { id: '2026-01-01', date: '2026-01-01', kg: 85, createdAt: 1 })
    const cb = vi.fn()
    createLocalRepo(localStorage, 'p:').watch('weights', cb)
    expect(cb.mock.lastCall![0][0].kg).toBe(85)
  })

  it('replaceAll overwrites everything', async () => {
    const repo = createLocalRepo(localStorage, 'r:')
    await repo.put('workouts', workout('2026-01-01', {}))
    await repo.replaceAll({ app: 'gymlog', version: 1, exportedAt: '', profile: null, workouts: [], exercises: [], weights: [] })
    const cb = vi.fn()
    repo.watch('workouts', cb)
    expect(cb).toHaveBeenLastCalledWith([])
  })
})
