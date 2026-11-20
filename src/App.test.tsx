import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from './App'
import { createLocalRepo } from './data/localRepo'
import { AuthProvider } from './state/AuthContext'
import { DataProvider } from './state/DataContext'

function renderApp(path = '/') {
  const repo = createLocalRepo(localStorage, 'ui:')
  render(
    <AuthProvider forceLocal>
      <DataProvider repo={repo}>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </DataProvider>
    </AuthProvider>,
  )
  return repo
}

async function logBench(user: ReturnType<typeof userEvent.setup>, sets: [string, string][]) {
  await user.click(within(screen.getByRole('navigation', { name: 'Main' })).getByRole('link', { name: 'Log' }))
  await user.click(screen.getByRole('button', { name: '+ Add exercise' }))
  await user.type(screen.getByPlaceholderText('Search exercises…'), 'bench press')
  await user.click(screen.getByRole('button', { name: /^Bench Press/ }))
  const card = screen.getByRole('region', { name: 'Bench Press' })
  for (let i = 0; i < sets.length; i++) {
    if (i > 0) await user.click(within(card).getByRole('button', { name: '+ Add set' }))
    const w = within(card).getByLabelText(`Set ${i + 1} weight`)
    const r = within(card).getByLabelText(`Set ${i + 1} reps`)
    await user.clear(w)
    await user.type(w, sets[i][0])
    await user.clear(r)
    await user.type(r, sets[i][1])
  }
  await user.click(screen.getByRole('button', { name: 'Save workout' }))
}

describe('App (local mode)', () => {
  it('renders the dashboard with empty states', () => {
    renderApp()
    expect(screen.getByText(/No workouts yet/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start workout' })).toBeInTheDocument()
  })

  it('logs two workouts and flags the second as a PR', async () => {
    const user = userEvent.setup()
    renderApp()
    await logBench(user, [['35', '10']])
    expect(await screen.findByText('Workout saved.')).toBeInTheDocument()
    expect(screen.queryByText(/new PR/)).not.toBeInTheDocument()

    await logBench(user, [['30', '12'], ['35', '10'], ['40', '10']])
    expect(await screen.findByText(/You set 3 new PRs/)).toBeInTheDocument()
    expect(screen.getByText('40 kg × 10 (prev 35 kg)')).toBeInTheDocument()
  })
})
