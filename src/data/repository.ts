import type { Backup, CollectionMap, CollectionName, Plan, Profile } from '../lib/types'

/**
 * Storage abstraction. The UI only talks to this interface, so the backend can be swapped
 * (Firestore today; see docs/decisions/0002-firebase-firestore.md for alternatives).
 *
 * Writes resolve once the change is committed locally. With Firestore they are queued
 * offline and synced later — callers must NOT wait for server acknowledgement.
 */
export interface Repository {
  readonly kind: 'firestore' | 'local'
  watch<K extends CollectionName>(name: K, cb: (items: CollectionMap[K][]) => void): () => void
  put<K extends CollectionName>(name: K, item: CollectionMap[K]): Promise<void>
  remove(name: CollectionName, id: string): Promise<void>
  watchProfile(cb: (p: Profile | null) => void): () => void
  saveProfile(p: Profile): Promise<void>
  watchPlan(cb: (p: Plan | null) => void): () => void
  savePlan(p: Plan): Promise<void>
  /** Replace everything with the backup contents (used by JSON import). */
  replaceAll(b: Backup): Promise<void>
}
