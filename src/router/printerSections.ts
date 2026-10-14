/**
 * The sections of a printer, as the rail and the phone's tabs list them, and
 * the pages in each. Until the later phases build each section as one page,
 * a section groups today's pages: Jobs holds Jobs, Preview, History and
 * Timelapse, and the page header shows them as tabs.
 *
 * `key` is the second key of the G shortcut (G then O for Overview).
 */
export type SectionId = 'overview' | 'jobs' | 'control' | 'slice' | 'camera' | 'maintenance' | 'settings' | 'console' | 'files'

/** What decides whether a section or a page shows. */
export interface SectionContext {
  pro: boolean;
  slicer: boolean;
  camera: string | null;
  history: boolean;
  timelapse: boolean;
  diagnostics: boolean;
}

export interface SectionPage {
  /** The page without its printer, as PRINTER_PAGE_PATHS lists it. */
  path: string;
  label: string;
  shows?: (c: SectionContext) => boolean;
}

export interface Section {
  id: SectionId;
  label: string;
  icon: string;
  key: string;
  /** Only with Pro on, below the Pro label. */
  pro?: boolean;
  shows?: (c: SectionContext) => boolean;
  pages: SectionPage[];
}

export const SECTIONS: Section[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'overview',
    key: 'o',
    pages: [
      { path: '/', label: 'Overview' },
      { path: '/diagnostics', label: 'Charts', shows: c => c.pro && c.diagnostics }
    ]
  },
  {
    id: 'jobs',
    label: 'Jobs',
    icon: 'jobs',
    key: 'j',
    pages: [
      { path: '/jobs', label: 'Jobs' },
      { path: '/preview', label: 'Preview' },
      { path: '/history', label: 'History', shows: c => c.history },
      { path: '/timelapse', label: 'Timelapse', shows: c => c.timelapse }
    ]
  },
  {
    id: 'control',
    label: 'Control',
    icon: 'control',
    key: 'c',
    pages: [{ path: '/control', label: 'Control' }]
  },
  {
    id: 'slice',
    label: 'Slice',
    icon: 'slice',
    key: 'l',
    shows: c => c.slicer,
    pages: [{ path: '/slice', label: 'Slice' }]
  },
  {
    id: 'camera',
    label: 'Camera',
    icon: 'camera',
    key: 'v',
    shows: c => c.camera !== null,
    pages: [{ path: '/camera', label: 'Camera' }]
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: 'maintenance',
    key: 'm',
    pages: [
      { path: '/maintenance', label: 'Health' },
      { path: '/tune', label: 'Bed mesh', shows: c => c.pro }
    ]
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    key: 's',
    pages: [
      { path: '/settings', label: 'Settings' },
      { path: '/wifi', label: 'Network' },
      { path: '/system', label: 'System' }
    ]
  },
  {
    id: 'console',
    label: 'Console',
    icon: 'console',
    key: 't',
    pro: true,
    pages: [{ path: '/console', label: 'Console' }]
  },
  {
    id: 'files',
    label: 'Files',
    icon: 'files',
    key: 'f',
    pro: true,
    pages: [{ path: '/configure', label: 'Files' }]
  }
]

/** G then P: every printer. */
export const ALL_PRINTERS_KEY = 'p'

/** Pages inside a section that have a G key of their own: G W Network, G U Software updates. */
export const PAGE_KEYS: Array<{ key: string, label: string, path: string, hash?: string }> = [
  { key: 'w', label: 'Network', path: '/wifi' },
  { key: 'u', label: 'Software updates', path: '/settings', hash: '#versions' }
]

/** Whether a printer page (without its printer) is `path` or one of its pages. */
export function pageMatches (page: string, path: string): boolean {
  if (path === '/') return page === '/'
  return page === path || page.startsWith(`${path}/`)
}

/** The section a printer page is in (`/history` is in Jobs), from its path without the printer. */
export function sectionOf (page: string): Section | undefined {
  return SECTIONS.find(s => s.pages.some(p => pageMatches(page, p.path)))
}

/** The sections shown: Pro's only with Pro on, and each only where it can work. */
export function visibleSections (c: SectionContext): Section[] {
  return SECTIONS.filter(s => (!s.pro || c.pro) && (!s.shows || s.shows(c)))
}

/** A section's pages that show, in order. */
export function visiblePages (section: Section, c: SectionContext): SectionPage[] {
  return section.pages.filter(p => !p.shows || p.shows(c))
}

/** Where a section's link goes: its first page, and a camera's own page. */
export function sectionPath (section: Section, c: SectionContext): string {
  if (section.id === 'camera' && c.camera) return `/camera/${c.camera}`
  return section.pages[0].path
}

/** The section a G key opens. */
export function sectionForKey (key: string, c: SectionContext): Section | undefined {
  return visibleSections(c).find(s => s.key === key)
}
