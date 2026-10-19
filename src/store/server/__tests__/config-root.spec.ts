import { beforeEach, describe, expect, it, vi } from 'vitest'
import { actions } from '../actions'
import { actions as socketStoreActions } from '@/store/socket/actions'

const socket = vi.hoisted(() => ({
  printerInfo: vi.fn(),
  serverConfig: vi.fn(),
  machineProcStats: vi.fn(),
  machineSystemInfo: vi.fn(),
  serverInfo: vi.fn(),
  identify: vi.fn(),
  printerObjectsList: vi.fn(),
  serverFilesListRoot: vi.fn()
}))
vi.mock('@/api/socketActions', () => ({ SocketActions: socket }))

const call = (action: unknown, context: object, payload?: unknown) =>
  (action as (context: object, payload?: unknown) => Promise<void>)(context, payload)

const info = (registered: string[], klippyState = 'ready') => ({
  klippy_state: klippyState,
  registered_directories: registered
})

const context = (klippyRetries = 0) => ({
  commit: vi.fn(),
  dispatch: vi.fn(),
  state: { klippy_retries: klippyRetries }
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listing the config root', () => {
  it('is not asked for when the socket opens, before the printer has said what it registers', async () => {
    await call(socketStoreActions.onSocketOpen, { commit: vi.fn() }, true)

    expect(socket.serverFilesListRoot).not.toHaveBeenCalled()
  })

  it('is not asked for on a printer that registers no config root (not in developer mode)', async () => {
    await call(actions.onServerInfo, context(), info(['calibration', 'defaults', 'logs', 'gcodes', 'docs'], 'shutdown'))

    expect(socket.serverFilesListRoot).not.toHaveBeenCalled()
  })

  it('is asked for once when the printer registers one', async () => {
    await call(actions.onServerInfo, context(), info(['config', 'gcodes']))

    expect(socket.serverFilesListRoot).toHaveBeenCalledTimes(1)
    expect(socket.serverFilesListRoot).toHaveBeenCalledWith('config')
  })

  it('is not asked for again while Klippy is still starting', async () => {
    await call(actions.onServerInfo, context(3), info(['config', 'gcodes'], 'startup'))

    expect(socket.serverFilesListRoot).not.toHaveBeenCalled()
  })
})
