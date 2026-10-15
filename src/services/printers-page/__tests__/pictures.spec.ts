import { afterEach, describe, expect, it, vi } from 'vitest'
import { cardThumbnail, jobPicture, jobPictures, thumbnailPath } from '../pictures'

const METADATA = {
  result: {
    filename: 'Harry/tray_v2_PETG.gcode',
    thumbnails: [
      { width: 32, height: 32, relative_path: '.thumbs/tray_v2_PETG-32x32.png' },
      { width: 300, height: 300, relative_path: '.thumbs/tray_v2_PETG-300x300.png' },
      { width: 600, height: 600, relative_path: '.thumbs/tray_v2_PETG-600x600.png' }
    ]
  }
}

const createObjectURL = URL.createObjectURL

afterEach(() => {
  jobPictures.urls = {}
  URL.createObjectURL = createObjectURL
})

describe("the part's picture on a card", () => {
  it('is read from the printer that prints it, through whatever reaches it, once per file', async () => {
    // A printer Fluidd isn't on had no picture on its card (14 Oct 2026).
    URL.createObjectURL = vi.fn(() => 'blob:walnut-part')
    const read = vi.fn(async (path: string) => {
      if (path.startsWith('/server/files/metadata')) return new Response(JSON.stringify(METADATA))
      return new Response(new Blob(['png']), { status: 200 })
    })

    expect(jobPicture('lan:http://192.168.137.73', 'Harry/tray_v2_PETG.gcode', read)).toBeNull()
    await vi.waitFor(() => expect(jobPictures.urls['lan:http://192.168.137.73|Harry/tray_v2_PETG.gcode']).toBe('blob:walnut-part'))

    expect(read.mock.calls.map(c => c[0])).toEqual([
      '/server/files/metadata?filename=Harry%2Ftray_v2_PETG.gcode',
      '/server/files/gcodes/Harry/.thumbs/tray_v2_PETG-300x300.png'
    ])
    expect(jobPicture('lan:http://192.168.137.73', 'Harry/tray_v2_PETG.gcode', read)).toBe('blob:walnut-part')
    expect(read).toHaveBeenCalledTimes(2)
  })

  it('is none when the job has no thumbnail or the read fails', async () => {
    const none = vi.fn(async () => new Response(JSON.stringify({ result: { thumbnails: [] } })))
    jobPicture('cloud:boxwood', 'cube.gcode', none)
    await vi.waitFor(() => expect(jobPictures.urls).toHaveProperty(['cloud:boxwood|cube.gcode'], null))

    const refused = vi.fn(async () => new Response('{}', { status: 403 }))
    jobPicture('cloud:boxwood', 'other.gcode', refused)
    await vi.waitFor(() => expect(jobPictures.urls).toHaveProperty(['cloud:boxwood|other.gcode'], null))
  })

  it('picks the largest up to 400 px, and finds it beside the job', () => {
    expect(cardThumbnail(METADATA.result.thumbnails)?.width).toBe(300)
    expect(cardThumbnail([{ width: 600, relative_path: 'a.png' }])?.width).toBe(600)
    expect(cardThumbnail([])).toBeNull()
    expect(thumbnailPath('cube.gcode', '.thumbs/cube 1.png')).toBe('/server/files/gcodes/.thumbs/cube%201.png')
  })
})
