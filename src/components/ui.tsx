import type { ReactNode } from 'react'
import { PR_LABELS, describePR, type PREvent } from '../lib/pr'

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card">
      <div className="label">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted">{hint}</div>}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</p>
}

export function PRBadge({ event, exerciseName }: { event: PREvent; exerciseName?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 p-3">
      <span aria-hidden className="mt-0.5 text-lg leading-none text-pr">★</span>
      <div className="min-w-0">
        <div className="text-sm font-semibold">
          {exerciseName && <span>{exerciseName} · </span>}
          <span className="text-pr">{PR_LABELS[event.type]}</span>
        </div>
        <div className="text-xs text-muted">{describePR(event)}</div>
      </div>
    </div>
  )
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mt-6 mb-2 flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      {action}
    </div>
  )
}

/** Minimal inline SVG trend line (no chart library needed for the MVP). */
export function Sparkline({ values, className = '' }: { values: number[]; className?: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - min) / range) * 26 - 2}`).join(' ')
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={`h-12 w-full ${className}`} aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}
