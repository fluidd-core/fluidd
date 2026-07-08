import { vi } from 'vitest'
import { SocketActions } from '@/api/socketActions'
import { actions } from '../actions'
import type { ConfigState } from '../types'

// Regression for the guarded-delete backport (review finding F5): removeSensorColor
// must use an own-property check, not `key in`, so a prototype-chain key name
// cannot spoof a Moonraker delete_item on a never-stored override.

vi.mock('@/api/socketActions', () => ({
  SocketActions: {
    serverDatabasePostItem: vi.fn(),
    serverDatabaseDeleteItem: vi.fn(),
  },
}))

const makeState = (sensorColors: Record<string, string> = {}): ConfigState =>
  ({ uiSettings: { dashboard: { sensorColors } } } as unknown as ConfigState)

type Commit = (type: string, payload?: unknown) => void
type RemoveSensorColor = (ctx: { commit: Commit; state: ConfigState }, payload: { key: string }) => Promise<void>
const removeSensorColor = actions.removeSensorColor as unknown as RemoveSensorColor

const KEY = 'temperature_sensor chamber'

describe('config store — removeSensorColor guarded delete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes from the DB when the override existed', async () => {
    const commit = vi.fn()
    const state = makeState({ [KEY]: '#ff0000' })
    await removeSensorColor({ commit, state }, { key: KEY })
    expect(commit).toHaveBeenCalledWith('setRemoveSensorColor', { key: KEY })
    expect(SocketActions.serverDatabaseDeleteItem).toHaveBeenCalledWith(
      ['uiSettings', 'dashboard', 'sensorColors', KEY]
    )
  })

  it('skips the network delete when no override existed', async () => {
    const commit = vi.fn()
    const state = makeState({})
    await removeSensorColor({ commit, state }, { key: KEY })
    expect(SocketActions.serverDatabaseDeleteItem).not.toHaveBeenCalled()
  })

  it('is not spoofed by a prototype-chain key name', async () => {
    const commit = vi.fn()
    const state = makeState({})
    await removeSensorColor({ commit, state }, { key: 'constructor' })
    await removeSensorColor({ commit, state }, { key: 'toString' })
    expect(SocketActions.serverDatabaseDeleteItem).not.toHaveBeenCalled()
  })
})
