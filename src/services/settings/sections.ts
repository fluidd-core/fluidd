/**
 * Settings' sections, as its list shows them. A section holds some of
 * Fluidd's settings cards, found by their anchors (`#theme` is in General),
 * or links to a page of its own (Wi-Fi, System). Pro's sections set up the
 * screens only Pro shows: the console, the file editor, the toolhead card.
 */
export type SettingsSectionId =
  'general' | 'network' | 'access' | 'updates' | 'cameras' | 'materials' | 'macros' |
  'timelapse' | 'spoolman' | 'console' | 'files' | 'toolhead' | 'gcodePreview' | 'system'

/** What decides whether a section shows. */
export interface SettingsContext {
  pro: boolean;
  /** Moonraker components the printer has: authorization, update_manager, timelapse, spoolman, muon_access, muon_protection. */
  components: string[];
}

export interface SettingsSection {
  id: SettingsSectionId;
  label: string;
  /** The cards' anchors, in order; the first is the section's own address. */
  anchors: string[];
  /** A page of its own instead of cards. */
  page?: string;
  pro?: boolean;
  shows?: (c: SettingsContext) => boolean;
}

const has = (component: string) => (c: SettingsContext) => c.components.includes(component)

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: 'general', label: 'General', anchors: ['general', 'theme'] },
  { id: 'network', label: 'Wi-Fi and network', anchors: [], page: '/wifi' },
  {
    id: 'access',
    label: 'People and access',
    anchors: ['access', 'protection', 'auth'],
    shows: c => ['muon_access', 'muon_protection', 'authorization'].some(name => c.components.includes(name))
  },
  { id: 'updates', label: 'Updates', anchors: ['versions'], shows: has('update_manager') },
  { id: 'cameras', label: 'Cameras', anchors: ['camera'] },
  { id: 'materials', label: 'Materials', anchors: ['presets'] },
  { id: 'macros', label: 'Macros', anchors: ['macros'] },
  { id: 'timelapse', label: 'Timelapse', anchors: ['timelapse'], shows: has('timelapse') },
  { id: 'spoolman', label: 'Spoolman', anchors: ['spoolman'], shows: has('spoolman') },
  { id: 'console', label: 'Console', anchors: ['console'], pro: true },
  { id: 'files', label: 'Files and editor', anchors: ['browser', 'editor'], pro: true },
  { id: 'toolhead', label: 'Toolhead card', anchors: ['toolhead'], pro: true },
  { id: 'gcodePreview', label: 'G-code preview', anchors: ['gcodePreview'], pro: true },
  { id: 'system', label: 'System', anchors: [], page: '/system' }
]

/** The sections that show: Pro's only with Pro on, and each only where the printer has what it sets. */
export function visibleSettingsSections (c: SettingsContext): SettingsSection[] {
  return SETTINGS_SECTIONS.filter(s => (!s.pro || c.pro) && (!s.shows || s.shows(c)))
}

/**
 * The section an address opens: `#theme` is General, `#versions` Updates.
 * No anchor, or one that isn't shown, is null, so a phone shows the list
 * and a wider screen the first section.
 */
export function settingsSectionFor (hash: string, sections: SettingsSection[]): SettingsSection | null {
  const anchor = hash.replace(/^#/, '')
  if (!anchor) return null
  return sections.find(s => s.anchors.includes(anchor)) ?? null
}
