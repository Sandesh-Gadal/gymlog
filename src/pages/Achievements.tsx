import { useState } from 'react'
import { Stat } from '../components/ui'
import { currentDayStreak, currentWeekStreak, type BadgeGroup, type BadgeStatus } from '../lib/achievements'
import { fmtKg, formatDate } from '../lib/format'
import { useData } from '../state/DataContext'

const GROUPS: BadgeGroup[] = ['Milestones', 'Streaks', 'Strength', 'Volume', 'Body']

export function Achievements() {
  const { achievements, workouts, weeklyTarget } = useData()
  const [now] = useState(() => new Date())
  const dates = workouts.map((w) => w.date)
  const unlocked = achievements.filter((a) => a.unlocked).length

  return (
    <div>
      <header className="mb-4">
        <h1 className="page-title">Achievements</h1>
        <p className="text-xs text-muted">
          {unlocked} of {achievements.length} badges unlocked
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Day streak" value={`🔥 ${currentDayStreak(dates, now)}`} hint="days in a row" />
        <Stat label="Week streak" value={`📅 ${currentWeekStreak(dates, weeklyTarget, now)}`} hint={`weeks with ${weeklyTarget}+ sessions`} />
      </div>

      {GROUPS.map((g) => (
        <section key={g} aria-label={g}>
          <h2 className="mt-6 mb-2 text-sm font-semibold text-muted">{g}</h2>
          <ul className="grid grid-cols-2 gap-3">
            {achievements
              .filter((a) => a.group === g)
              .map((a) => (
                <BadgeCard key={a.id} badge={a} />
              ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function BadgeCard({ badge: a }: { badge: BadgeStatus }) {
  const pct = Math.min(100, (a.progress / a.target) * 100)
  const unit = a.metric === 'sessionVolume' || a.metric === 'lifetimeVolume' || a.metric === 'kgLost' ? ' kg' : ''
  return (
    <li className={`card flex flex-col items-center p-3 text-center ${a.unlocked ? 'border-accent' : ''}`} aria-label={`${a.name}${a.unlocked ? ', unlocked' : ', locked'}`}>
      <span className={`text-3xl ${a.unlocked ? '' : 'opacity-30 grayscale'}`} aria-hidden>
        {a.emoji}
      </span>
      <b className="mt-1 text-sm">{a.name}</b>
      <span className="text-[11px] leading-tight text-muted">{a.description}</span>
      {a.unlocked ? (
        <span className="mt-2 text-[11px] font-semibold text-accent">{formatDate(a.unlocked.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      ) : (
        <span className="mt-2 w-full">
          <span className="block h-1 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-accent/60" style={{ width: `${pct}%` }} />
          </span>
          <span className="mt-1 block text-[10px] text-muted">
            {fmtKg(Math.max(0, a.progress))}
            {unit} / {fmtKg(a.target)}
            {unit}
          </span>
        </span>
      )}
    </li>
  )
}
