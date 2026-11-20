import type { Backup, CollectionMap, CollectionName, Profile } from '../lib/types'
import type { Repository } from './repository'

/**
 * localStorage-backed repository. Used for "local mode" (no Firebase configured),
 * local development and tests. Data never leaves the device.
 */
export function createLocalRepo(storage: Storage = window.localStorage, prefix = 'gymlog:'): Repository {
  type Listener = (v: unknown) => void
  const listeners = new Map<string, Set<Listener>>()

  const read = <T>(key: string, fallback: T): T => {
    try {
      const raw = storage.getItem(prefix + key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  }
  const write = (key: string, value: unknown) => {
    storage.setItem(prefix + key, JSON.stringify(value))
    listeners.get(key)?.forEach((l) => l(value))
  }
  const listen = (key: string, l: Listener, initial: unknown) => {
    if (!listeners.has(key)) listeners.set(key, new Set())
    listeners.get(key)!.add(l)
    l(initial)
    return () => {
      listeners.get(key)?.delete(l)
    }
  }

  return {
    kind: 'local',
    watch<K extends CollectionName>(name: K, cb: (items: CollectionMap[K][]) => void) {
      return listen(name, cb as Listener, read<CollectionMap[K][]>(name, []))
    },
    async put<K extends CollectionName>(name: K, item: CollectionMap[K]) {
      const items = read<CollectionMap[K][]>(name, []).filter((i) => i.id !== item.id)
      write(name, [...items, item])
    },
    async remove(name, id) {
      write(name, read<{ id: string }[]>(name, []).filter((i) => i.id !== id))
    },
    watchProfile(cb) {
      return listen('profile', cb as Listener, read<Profile | null>('profile', null))
    },
    async saveProfile(p) {
      write('profile', p)
    },
    async replaceAll(b: Backup) {
      write('workouts', b.workouts)
      write('exercises', b.exercises)
      write('weights', b.weights)
      write('profile', b.profile)
    },
  }
}
