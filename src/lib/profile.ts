import type { Profile } from './types'

/** Starting values from the project brief; all editable on the Profile page. */
export const DEFAULT_PROFILE: Profile = {
  name: '',
  heightCm: 179,
  waistIn: 36,
  startWeightKg: 85,
  daysPerWeek: 5,
  sessionMinutes: 60,
  goals: 'Fat loss, muscle development, broader chest and shoulders',
  updatedAt: 0,
}

export function bmi(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) return 0
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}
