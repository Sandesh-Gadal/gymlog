import { fmtKg, formatDate } from '../lib/format'
import type { Heatmap as HeatmapData, HeatLevel } from '../lib/heatmap'

const LEVEL_CLASS: Record<HeatLevel, string> = {
  0: 'bg-surface-2',
  1: 'bg-accent/25',
  2: 'bg-accent/50',
  3: 'bg-accent/75',
  4: 'bg-accent',
}

/** GitHub-style contribution grid: one column per week, Monday at the top. */
export function Heatmap({ data }: { data: HeatmapData }) {
  const cols = { gridTemplateColumns: `repeat(${data.weeks.length}, minmax(0, 1fr))` }

  return (
    <div>
      {/* Month label above the column whose Monday falls on the 1st–7th, i.e. the week the month starts */}
      <div className="mb-1 grid gap-0.75 text-[10px] leading-none text-muted" style={cols} aria-hidden>
        {data.weeks.map((week) => (
          <span key={week[0].date} className="overflow-visible whitespace-nowrap">
            {Number(week[0].date.slice(8)) <= 7 ? formatDate(week[0].date, { month: 'short' }) : ''}
          </span>
        ))}
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-0.75" style={cols} role="img" aria-label={`${data.sessions} workouts on ${data.activeDays} days in the last ${data.weeks.length} weeks`}>
        {data.weeks.flat().map((c) => (
          <span
            key={c.date}
            title={
              c.future
                ? undefined
                : c.sessions
                  ? `${formatDate(c.date)}: ${c.sessions > 1 ? `${c.sessions} workouts, ` : ''}${fmtKg(c.volume)} kg`
                  : `${formatDate(c.date)}: rest`
            }
            className={`aspect-square rounded-[3px] ${c.future ? 'bg-transparent' : LEVEL_CLASS[c.level]}`}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted" aria-hidden>
        <span className="mr-0.5">Less</span>
        {([0, 1, 2, 3, 4] as const).map((l) => (
          <span key={l} className={`size-2.5 rounded-xs ${LEVEL_CLASS[l]}`} />
        ))}
        <span className="ml-0.5">More</span>
      </div>
    </div>
  )
}
