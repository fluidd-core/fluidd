import { describe, expect, it } from 'vitest'
import { changedLines, opensInEditor, orderRoots, restartNote, rootGroup, validName } from '../model'

describe('Files\' folders', () => {
  it('names MuonOS\'s roots for people', () => {
    expect(rootGroup('calibration').title).toBe('This printer\'s settings')
    expect(rootGroup('defaults').note).toMatch(/^read only/)
    expect(rootGroup('logs').download).toBe(true)
    expect(rootGroup('timelapse_frames').title).toBe('Timelapse frames')
  })

  it('lists the printer\'s own first', () => {
    expect(orderRoots(['docs', 'logs', 'defaults', 'calibration', 'zzz', 'config'])).toEqual(['config', 'calibration', 'defaults', 'logs', 'docs', 'zzz'])
  })
})

describe('opening a file', () => {
  it('edits text files under 2 MB and downloads the rest', () => {
    expect(opensInEditor('printer.cfg', 4000)).toBe(true)
    expect(opensInEditor('moonraker.conf', 900)).toBe(true)
    expect(opensInEditor('klippy.log', 30_000_000)).toBe(false)
    expect(opensInEditor('photo.jpg', 100)).toBe(false)
  })
})

describe('saving', () => {
  it('says a Klipper restart stops a print, and whether one is running', () => {
    expect(restartNote('klipper', 'Boxwood', false)).toBe('Restarting Klipper stops a print. Boxwood isn\'t printing, so it\'s safe now.')
    expect(restartNote('klipper', 'Boxwood', true)).toMatch(/is printing: save now, and restart once it's done\.$/)
    expect(restartNote('moonraker', 'Boxwood', true)).toBe('Saving and restarting restarts Moonraker.')
    expect(restartNote(null, 'Boxwood', false)).toBe('')
  })

  it('counts the lines changed', () => {
    expect(changedLines('a\nb\nc', 'a\nB\nc')).toBe(1)
    expect(changedLines('a\nb', 'a\nb\nc\nd')).toBe(2)
    expect(changedLines('same', 'same')).toBe(0)
  })

  it('takes names without slashes', () => {
    expect(validName('my_macros.cfg')).toBe(true)
    expect(validName('macros/x.cfg')).toBe(false)
    expect(validName('..')).toBe(false)
    expect(validName('  ')).toBe(false)
  })
})
