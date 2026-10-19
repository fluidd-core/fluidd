import { beforeEach, describe, expect, it, vi } from 'vitest'
import FilesMixin from '../files'
import { httpClientActions } from '@/api/httpClientActions'
import { SocketActions } from '@/api/socketActions'

vi.mock('@/api/httpClientActions', () => ({
  httpClientActions: {
    serverFilesUploadPost: vi.fn()
  }
}))

vi.mock('@/api/socketActions', () => ({
  SocketActions: {
    serverFilesGetDirectory: vi.fn()
  }
}))

function uploader () {
  return {
    performUploadFile: (FilesMixin as any).options.methods.performUploadFile,
    $store: {
      dispatch: vi.fn(),
      state: { files: { uploads: [] } }
    }
  }
}

describe('FilesMixin upload request ownership', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const upload = (owner: ReturnType<typeof uploader>, file: File) =>
    (FilesMixin as any).options.methods.uploadFile.call(owner, file, '', 'gcodes', false) as Promise<unknown>

  it('sends one request when one browser action reaches two upload listeners', async () => {
    let finish: (value: unknown) => void = () => {}
    vi.mocked(httpClientActions.serverFilesUploadPost).mockImplementation(() => new Promise(resolve => { finish = resolve }) as any)
    const file = new File(['G28\n'], 'boxwood.gcode', { type: 'text/x-gcode' })
    const firstListener = upload(uploader(), file)
    const secondListener = upload(uploader(), file)

    expect(httpClientActions.serverFilesUploadPost).toHaveBeenCalledTimes(1)
    expect(SocketActions.serverFilesGetDirectory).not.toHaveBeenCalled()

    finish({ data: { result: { item: { path: file.name, root: 'gcodes' } } } })
    await expect(Promise.all([firstListener, secondListener])).resolves.toHaveLength(2)
  })

  it('allows a retry only after the failed request has settled', async () => {
    vi.mocked(httpClientActions.serverFilesUploadPost)
      .mockRejectedValueOnce(new Error('relay refused the upload'))
      .mockResolvedValueOnce({ data: { result: { item: { path: 'boxwood.gcode', root: 'gcodes' } } } } as any)
    const file = new File(['G28\n'], 'boxwood.gcode')

    await expect(upload(uploader(), file)).rejects.toThrow('relay refused')
    await expect(upload(uploader(), file)).resolves.toBeDefined()

    expect(httpClientActions.serverFilesUploadPost).toHaveBeenCalledTimes(2)
  })

  it('does not suppress a later deliberate upload after success', async () => {
    vi.mocked(httpClientActions.serverFilesUploadPost).mockResolvedValue({ data: { result: { item: { path: 'boxwood.gcode', root: 'gcodes' } } } } as any)
    const file = new File(['G28\n'], 'boxwood.gcode')

    await upload(uploader(), file)
    await upload(uploader(), file)

    expect(httpClientActions.serverFilesUploadPost).toHaveBeenCalledTimes(2)
  })
})
