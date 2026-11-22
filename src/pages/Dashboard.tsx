import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Heatmap } from '../components/Heatmap'
import { Empty, PRBadge, SectionHeader, Stat } from '../components/ui'
import { addDays, fmtKg, formatDate, startOfWeek, toISODate, todayISO } from '../lib/format'
import { currentDayStreak, currentWeekStreak } from '../lib/achievements'
import { buildHeatmap } from '../lib/heatmap'
import { sessionFor } from '../lib/plan'
import { workoutVolume } from '../lib/pr'
import { useData } from '../state/DataContext'

export function Dashboard() {
  const { profile, plan, workouts, weights, prEvents, exerciseName, weeklyTarget: target, achievements } = useData()
  const [now] = useState(() => new Date())
  const today = todayISO(now)
  const weekStart = startOfWeek(now)
  const weekDays = Array.from({ length: 7 }, (_, i) => toISODate(addDays(weekStart, i)))
  const trainedDates = new Set(workouts.map((w) => w.date))
  const thisWeek = weekDays.filter((d) => trainedDates.has(d)).length
  const todaySession = sessionFor(plan, today)
  const dayStreak = currentDayStreak(trainedDates, now)
  const weekStreak = currentWeekStreak(workouts.map((w) => w.date), target, now)
  const badges = achievements.filter((a) => a.unlocked)
  const latestBadge = [...badges].sort((a, b) => b.unlocked!.date.localeCompare(a.unlocked!.date))[0]
  const heatmap = useMemo(() => buildHeatmap(workouts, now), [workouts, now])

  const latest = weights[0]
  const prevWeight = weights[1]
  const delta = latest && prevWeight ? latest.kg - prevWeight.kg : undefined
  const fromStart = latest ? latest.kg - profile.startWeightKg : undefined

  const lastWorkout = workouts[0]
  const recentPRs = [...prEvents].reverse().slice(0, 5)
  const greeting = profile.name ? `Hi, ${profile.name}` : 'GYMLOG'

  return (
    <div>
      <header className="mb-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-muted">{formatDate(today, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <h1 className="page-title">{greeting}</h1>
        </div>
        <Link to="/log" className="btn-primary">
          {trainedDates.has(today) ? 'Log another' : todaySession ? `Start ${todaySession.title}` : 'Start workout'}
        </Link>
      </header>

      <section className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="label mb-0">This week</span>
          <span className="text-sm">
            <b className="text-fg">{thisWeek}</b>
            <span className="text-muted"> / {target} {plan ? 'planned' : 'sessions'}</span>
          </span>
        </div>
        <ol className="grid grid-cols-7 gap-1.5" aria-label="Training days this week">
          {weekDays.map((d) => {
            const done = trainedDates.has(d)
            const isToday = d === today
            return (
              <li key={d} className="flex flex-col items-center gap-1">
                <span className={`text-[10px] ${isToday ? 'font-bold text-fg' : 'text-muted'}`}>
                  {formatDate(d, { weekday: 'narrow' })}
                </span>
                <span
                  title={done ? 'Trained' : 'No workout'}
                  className={`grid size-8 place-items-center rounded-full text-xs ${
                    done ? 'bg-accent font-bold text-accent-ink' : isToday ? 'border border-accent text-fg' : 'bg-surface-2 text-muted'
                  }`}
                >
                  {Number(d.slice(8))}
                </span>
                {plan && (
                  <span className={`max-w-full truncate text-[10px] ${isToday ? 'font-semibold text-fg' : 'text-muted'}`}>
                    {sessionFor(plan, d)?.title ?? 'Rest'}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
        <Link to="/plan" className="mt-3 block text-xs text-muted">
          {plan ? (
            <>
              Today: <b className="text-fg">{todaySession?.title ?? 'Rest day'}</b>
              {plan.daily.length > 0 && ' + mobility'} · <span className="text-accent">Edit plan</span>
            </>
          ) : (
            <>
              No weekly plan yet. <span className="text-accent">Set one up</span>
            </>
          )}
        </Link>
      </section>

      <Link to="/achievements" className="card mt-3 flex items-center justify-between gap-3" aria-label="Achievements">
        <span className="flex gap-4 text-sm">
          <span title="Day streak">
            🔥 <b className="text-fg">{dayStreak}</b> <span className="text-muted">day{dayStreak === 1 ? '' : 's'}</span>
          </span>
          <span title="Weeks on target">
            📅 <b className="text-fg">{weekStreak}</b> <span className="text-muted">wk{weekStreak === 1 ? '' : 's'}</span>
          </span>
        </span>
        <span className="truncate text-sm text-muted">
          {latestBadge ? `${latestBadge.emoji} ${latestBadge.name}` : '🏅'} · <b className="text-fg">{badges.length}</b>/{achievements.length} ›
        </span>
      </Link>

      <section className="card mt-3">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="label mb-0">Last 6 months</span>
          <span className="text-sm text-muted">
            <b className="text-fg">{heatmap.sessions}</b> workouts
          </span>
        </div>
        <Heatmap data={heatmap} />
      </section>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Link to="/weight" className="block">
          <Stat
            label="Body weight"
            value={latest ? `${fmtKg(latest.kg)} kg` : '—'}
            hint={
              latest
                ? `${delta !== undefined ? `${delta > 0 ? '+' : ''}${fmtKg(delta)} since last · ` : ''}${fromStart! > 0 ? '+' : ''}${fmtKg(fromStart!)} total`
                : 'Tap to log'
            }
          />
        </Link>
        <Stat label="Workouts" value={workouts.length} hint={`${prEvents.length} PRs all-time`} />
      </div>

      <SectionHeader title="Last workout" action={<Link className="text-xs text-accent" to="/history">History</Link>} />
      {lastWorkout ? (
        <Link to={`/workout/${lastWorkout.id}`} className="card block">
          <div className="flex justify-between text-sm">
            <span className="font-semibold">{formatDate(lastWorkout.date)}</span>
            <span className="text-muted">{fmtKg(workoutVolume(lastWorkout))} kg volume</span>
          </div>
          <p className="mt-1 truncate text-sm text-muted">{lastWorkout.entries.map((e) => exerciseName(e.exerciseId)).join(' · ')}</p>
        </Link>
      ) : (
        <Empty>No workouts yet. Tap “Start workout” to log your first session.</Empty>
      )}

      <SectionHeader title="Recent PRs" />
      {recentPRs.length ? (
        <div className="space-y-2">
          {recentPRs.map((e, i) => (
            <PRBadge key={`${e.workoutId}-${e.exerciseId}-${e.type}-${i}`} event={e} exerciseName={exerciseName(e.exerciseId)} />
          ))}
        </div>
      ) : (
        <Empty>PRs appear here automatically once you beat a previous session.</Empty>
      )}
    </div>
  )
}
