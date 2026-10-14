import { describe, expect, it, test } from 'vitest'
import { PRINTER_PAGE_PATHS } from '../printerPagePaths'
import {
  PAGE_KEYS,
  SECTIONS,
  sectionForKey,
  sectionOf,
  sectionPath,
  visiblePages,
  visibleSections,
  type SectionContext
} from '../printerSections'

const simple: SectionContext = { pro: false, slicer: false, camera: null, history: true, timelapse: false, diagnostics: true }
const everything: SectionContext = { pro: true, slicer: true, camera: 'front', history: true, timelapse: true, diagnostics: true }

const ids = (c: SectionContext) => visibleSections(c).map(s => s.id)

describe("a printer's sections", () => {
  test.each([
    ['/', 'overview'],
    ['/diagnostics', 'overview'],
    ['/jobs', 'jobs'],
    ['/history', 'jobs'],
    ['/preview', 'jobs'],
    ['/settings/macros/abc', 'settings'],
    ['/wifi', 'settings'],
    ['/camera/front', 'camera'],
    ['/maintenance', 'maintenance'],
    ['/tune', 'maintenance'],
    ['/control', 'control'],
    ['/configure', 'files']
  ])('%s is in %s', (page, id) => {
    expect(sectionOf(page)?.id).toBe(id)
  })

  it('have a home for every printer page, so none is lost from the rail', () => {
    for (const page of PRINTER_PAGE_PATHS) {
      expect(sectionOf(page), page).toBeDefined()
    }
  })

  it('show Console and Files only with Pro on', () => {
    expect(ids(simple)).toEqual(['overview', 'jobs', 'control', 'maintenance', 'settings'])
    expect(ids(everything)).toEqual(['overview', 'jobs', 'control', 'slice', 'camera', 'maintenance', 'settings', 'console', 'files'])
  })

  it('show a page only where it can work', () => {
    const jobs = SECTIONS.find(s => s.id === 'jobs')!
    expect(visiblePages(jobs, simple).map(p => p.path)).toEqual(['/jobs', '/preview', '/history'])
    const overview = SECTIONS.find(s => s.id === 'overview')!
    expect(visiblePages(overview, simple).map(p => p.path)).toEqual(['/'])
    expect(visiblePages(overview, everything).map(p => p.path)).toEqual(['/', '/diagnostics'])
    const maintenance = SECTIONS.find(s => s.id === 'maintenance')!
    expect(visiblePages(maintenance, simple).map(p => p.path)).toEqual(['/maintenance'])
    expect(visiblePages(maintenance, everything).map(p => p.path)).toEqual(['/maintenance', '/tune'])
  })

  it("go to the first camera's own page", () => {
    const camera = SECTIONS.find(s => s.id === 'camera')!
    expect(sectionPath(camera, everything)).toBe('/camera/front')
  })

  it('each have their own G key, none of them P', () => {
    const keys = [...SECTIONS.map(s => s.key), ...PAGE_KEYS.map(p => p.key)]
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).not.toContain('p')
    expect(keys).not.toContain('g')
  })

  it('open from their G key only when shown', () => {
    expect(sectionForKey('j', simple)?.id).toBe('jobs')
    expect(sectionForKey('t', simple)).toBeUndefined()
    expect(sectionForKey('t', everything)?.id).toBe('console')
  })
})
