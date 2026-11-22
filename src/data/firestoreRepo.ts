import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
import type { Backup, CollectionMap, CollectionName, Plan, Profile } from '../lib/types'
import type { Repository } from './repository'

/**
 * Layout (see docs/data-model.md):
 *   users/{uid}/workouts/{id}
 *   users/{uid}/exercises/{id}   (custom exercises only)
 *   users/{uid}/weights/{date}
 *   users/{uid}/meta/profile
 *   users/{uid}/meta/plan
 */
export function createFirestoreRepo(db: Firestore, uid: string): Repository {
  const col = (name: CollectionName) => collection(db, 'users', uid, name)
  const profileRef = doc(db, 'users', uid, 'meta', 'profile')
  const planRef = doc(db, 'users', uid, 'meta', 'plan')

  // Firestore resolves write promises only after the server acknowledges. Offline that
  // never happens until reconnect, so we resolve immediately and log failures instead.
  const fire = (p: Promise<unknown>) => {
    p.catch((err) => console.error('[gymlog] sync failed', err))
    return Promise.resolve()
  }

  return {
    kind: 'firestore',
    watch<K extends CollectionName>(name: K, cb: (items: CollectionMap[K][]) => void) {
      return onSnapshot(col(name), (snap) => cb(snap.docs.map((d) => d.data() as CollectionMap[K])))
    },
    put(name, item) {
      return fire(setDoc(doc(col(name), item.id), stripUndefined(item)))
    },
    remove(name, id) {
      return fire(deleteDoc(doc(col(name), id)))
    },
    watchProfile(cb) {
      return onSnapshot(profileRef, (snap) => cb(snap.exists() ? (snap.data() as Profile) : null))
    },
    saveProfile(p) {
      return fire(setDoc(profileRef, p))
    },
    watchPlan(cb) {
      return onSnapshot(planRef, (snap) => cb(snap.exists() ? (snap.data() as Plan) : null))
    },
    savePlan(p) {
      return fire(setDoc(planRef, stripUndefined(p)))
    },
    async replaceAll(b: Backup) {
      // Batches are limited to 500 operations each.
      const ops: ((batch: ReturnType<typeof writeBatch>) => void)[] = []
      for (const name of ['workouts', 'exercises', 'weights'] as const) {
        const existing = await getDocs(col(name))
        existing.forEach((d) => ops.push((batch) => batch.delete(d.ref)))
        for (const item of b[name]) ops.push((batch) => batch.set(doc(col(name), item.id), stripUndefined(item)))
      }
      if (b.profile) ops.push((batch) => batch.set(profileRef, b.profile!))
      if (b.plan) ops.push((batch) => batch.set(planRef, stripUndefined(b.plan!)))
      for (let i = 0; i < ops.length; i += 450) {
        const batch = writeBatch(db)
        ops.slice(i, i + 450).forEach((op) => op(batch))
        await fire(batch.commit())
      }
    },
  }
}

/** Firestore rejects `undefined` field values. */
function stripUndefined<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}
