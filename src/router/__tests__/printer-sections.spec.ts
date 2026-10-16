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

const simple: SectionContext = { pro: false, slicer: false, camera: null, history: true, timelapse: false, diagnostics: true, foreign: false }
const everything: SectionContext = { pro: true, slicer: true, camera: 'front', history: true, timelapse: true, diagnostics: true, foreign: false, bedMesh: true }

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
    // The Library is the account's, with a rail entry of its own under All printers;
    // the account itself (KAN-532) opens from the header's menu and G A.
    for (const page of PRINTER_PAGE_PATHS.filter(path => !['/library', '/account'].includes(path))) {
      expect(sectionOf(page), page).toBeDefined()
    }
  })

  it('shows native tools with Pro off as well as on', () => {
    expect(ids(simple)).toEqual(['overview', 'jobs', 'control', 'maintenance', 'settings', 'console', 'files'])
    expect(ids(everything)).toEqual(['overview', 'jobs', 'control', 'slice', 'camera', 'maintenance', 'settings', 'console', 'files'])
  })

  it('shows exactly Overview, Jobs, Slice and Camera for a foreign printer', () => {
    expect(ids({ ...everything, foreign: true })).toEqual(['overview', 'jobs', 'slice', 'camera'])
  })

  it('show a page only where it can work', () => {
    const jobs = SECTIONS.find(s => s.id === 'jobs')!
    expect(visiblePages(jobs, simple).map(p => p.path)).toEqual(['/jobs', '/preview', '/history'])
    const overview = SECTIONS.find(s => s.id === 'overview')!
    expect(visiblePages(overview, simple).map(p => p.path)).toEqual(['/', '/diagnostics'])
    expect(visiblePages(overview, { ...simple, pro: true }).map(p => p.path)).toEqual(['/', '/diagnostics'])
    expect(visiblePages(overview, { ...everything, diagnostics: false }).map(p => p.path)).toEqual(['/'])
    expect(visiblePages(overview, everything).map(p => p.path)).toEqual(['/', '/diagnostics'])
    const maintenance = SECTIONS.find(s => s.id === 'maintenance')!
    expect(visiblePages(maintenance, simple).map(p => p.path)).toEqual(['/maintenance'])
    expect(visiblePages(maintenance, everything).map(p => p.path)).toEqual(['/maintenance', '/tune'])
  })

  it('does not add printer-only pages to a foreign printer', () => {
    const overview = SECTIONS.find(s => s.id === 'overview')!
    expect(visibleSections({ ...everything, foreign: true }).map(s => s.id)).toEqual(['overview', 'jobs', 'slice', 'camera'])
    expect(visiblePages(overview, { ...everything, foreign: true, diagnostics: false }).map(p => p.path)).toEqual(['/'])
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
    expect(sectionForKey('t', simple)?.id).toBe('console')
    expect(sectionForKey('f', simple)?.id).toBe('files')
    expect(sectionForKey('t', everything)?.id).toBe('console')
    expect(sectionForKey('f', everything)?.id).toBe('files')
    expect(sectionForKey('t', { ...everything, foreign: true })).toBeUndefined()
    expect(sectionForKey('f', { ...simple, foreign: true })).toBeUndefined()
  })
})
