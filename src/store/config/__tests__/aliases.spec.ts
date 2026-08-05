import { vi } from 'vitest'
import { SocketActions } from '@/api/socketActions'
import { mutations } from '../mutations'
import { actions } from '../actions'
import type { ConfigState } from '../types'

vi.mock('@/api/socketActions', () => ({
  SocketActions: {
    serverDatabasePostItem: vi.fn(),
    serverDatabaseDeleteItem: vi.fn(),
  },
}))

// Minimal slice of ConfigState needed by the alias mutations/actions.
const makeState = (aliases: Record<string, string> = {}): ConfigState =>
  ({ uiSettings: { dashboard: { aliases } } } as unknown as ConfigState)

// Typed shims so the actions can be called directly with a mock context.
type Commit = (type: string, payload?: unknown) => void
type Dispatch = (type: string, payload?: unknown) => Promise<void>
type UpdateAlias = (ctx: { commit: Commit; dispatch: Dispatch }, payload: { key: string; name: string }) => Promise<void>
type RemoveAlias = (ctx: { commit: Commit; state: ConfigState }, payload: { key: string }) => Promise<void>
const updateAlias = actions.updateAlias as unknown as UpdateAlias
const removeAlias = actions.removeAlias as unknown as RemoveAlias

const KEY = 'output_pin fan2'
const DB_PATH = ['uiSettings', 'dashboard', 'aliases', 'output_pin fan2']

describe('config store — aliases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('mutations', () => {
    it('setAlias adds a new entry (reactively via Vue.set)', () => {
      const state = makeState()
      mutations.setAlias(state, { key: KEY, name: 'Side Fan' })
      expect(state.uiSettings.dashboard.aliases).toStrictEqual({ [KEY]: 'Side Fan' })
    })

    it('setAlias overwrites an existing entry', () => {
      const state = makeState({ [KEY]: 'Old' })
      mutations.setAlias(state, { key: KEY, name: 'New' })
      expect(state.uiSettings.dashboard.aliases[KEY]).toBe('New')
    })

    it('setRemoveAlias deletes an entry', () => {
      const state = makeState({ [KEY]: 'Side Fan' })
      mutations.setRemoveAlias(state, { key: KEY })
      expect(state.uiSettings.dashboard.aliases).toStrictEqual({})
    })
  })

  describe('actions', () => {
    it('updateAlias commits and persists the trimmed value (key kept whole)', async () => {
      const commit = vi.fn()
      const dispatch = vi.fn()
      await updateAlias({ commit, dispatch }, { key: KEY, name: '  Side Fan  ' })
      expect(commit).toHaveBeenCalledWith('setAlias', { key: KEY, name: 'Side Fan' })
      expect(SocketActions.serverDatabasePostItem).toHaveBeenCalledWith(DB_PATH, 'Side Fan')
      expect(dispatch).not.toHaveBeenCalled()
    })

    it('updateAlias keeps a dotted key unsplit in the DB path', async () => {
      const commit = vi.fn()
      const dispatch = vi.fn()
      await updateAlias({ commit, dispatch }, { key: 'temperature_sensor my.sensor', name: 'Chamber' })
      expect(SocketActions.serverDatabasePostItem).toHaveBeenCalledWith(
        ['uiSettings', 'dashboard', 'aliases', 'temperature_sensor my.sensor'],
        'Chamber'
      )
    })

    it('updateAlias with a blank name delegates to removeAlias and never persists ""', async () => {
      const commit = vi.fn()
      const dispatch = vi.fn()
      await updateAlias({ commit, dispatch }, { key: KEY, name: '   ' })
      expect(dispatch).toHaveBeenCalledWith('removeAlias', { key: KEY })
      expect(commit).not.toHaveBeenCalled()
      expect(SocketActions.serverDatabasePostItem).not.toHaveBeenCalled()
    })

    it('removeAlias deletes from the DB when the alias existed', async () => {
      const commit = vi.fn()
      const state = makeState({ [KEY]: 'Side Fan' })
      await removeAlias({ commit, state }, { key: KEY })
      expect(commit).toHaveBeenCalledWith('setRemoveAlias', { key: KEY })
      expect(SocketActions.serverDatabaseDeleteItem).toHaveBeenCalledWith(DB_PATH)
    })

    it('removeAlias skips the network delete when no alias existed', async () => {
      const commit = vi.fn()
      const state = makeState({})
      await removeAlias({ commit, state }, { key: KEY })
      expect(commit).toHaveBeenCalledWith('setRemoveAlias', { key: KEY })
      expect(SocketActions.serverDatabaseDeleteItem).not.toHaveBeenCalled()
    })

    it('removeAlias is not spoofed by a prototype-chain key name', async () => {
      const commit = vi.fn()
      const state = makeState({})
      // `constructor`/`toString` are truthy via `key in obj` but must NOT trigger a delete.
      await removeAlias({ commit, state }, { key: 'constructor' })
      await removeAlias({ commit, state }, { key: 'toString' })
      expect(SocketActions.serverDatabaseDeleteItem).not.toHaveBeenCalled()
    })
  })
})
