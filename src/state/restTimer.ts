const KEY = 'gymlog:rest'

/** Default rest in seconds, per device. Adjusting the running timer updates it. */
export function getRestSeconds(): number {
  const v = Number(localStorage.getItem(KEY))
  return v >= 15 && v <= 600 ? v : 90
}
export function setRestSeconds(sec: number): void {
  localStorage.setItem(KEY, String(Math.min(600, Math.max(15, sec))))
}
