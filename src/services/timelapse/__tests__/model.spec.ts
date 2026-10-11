import { describe, expect, it } from 'vitest'
import { frameFile, renderText, timelapseItems, timelapseName } from '../model'

describe('a timelapse\'s name', () => {
  it('reads the print and when it rendered from moonraker-timelapse\'s name', () => {
    expect(timelapseName('timelapse_octopus_brain_keychain+8_0.2mm_PLA_20261011_1405.mp4'))
      .toEqual({ title: 'Octopus brain keychain ×8', when: '11 Oct 14:05' })
  })

  it('keeps any other file\'s name', () => {
    expect(timelapseName('my_clip.mp4')).toEqual({ title: 'my_clip', when: null })
  })
})

describe('the timelapse folder', () => {
  const files = [
    { filename: 'timelapse_a_20261010_0900.mp4', size: 5e6, modified: 100 },
    { filename: 'timelapse_a_20261010_0900.jpg', size: 2e5, modified: 100 },
    { filename: 'timelapse_b_20261011_1000.zip', size: 9e6, modified: 200 },
    { filename: 'notes.txt', size: 1, modified: 300 }
  ]

  it('lists videos and saved frames, newest first, with the picture beside each', () => {
    const items = timelapseItems(files)
    expect(items.map(i => [i.name, i.kind, i.thumbnail])).toEqual([
      ['timelapse_b_20261011_1000.zip', 'frames', null],
      ['timelapse_a_20261010_0900.mp4', 'video', 'timelapse_a_20261010_0900.jpg']
    ])
  })
})

describe('frames and rendering', () => {
  it('names a frame as the plugin does', () => {
    expect(frameFile(42, 'frame000120.jpg')).toBe('frame000042.jpg')
    expect(frameFile(1, 'frame000003.png')).toBe('frame000001.png')
  })

  it('says what the renderer is doing', () => {
    expect(renderText({ status: 'running', progress: 41.6 })).toBe('Rendering… 42%')
    expect(renderText({ status: 'started', count: 120 })).toBe('Starting to render 120 frames…')
    expect(renderText({ status: 'success' })).toBeNull()
    expect(renderText(undefined)).toBeNull()
  })
})
