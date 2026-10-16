import { describe, expect, it } from 'vitest'
import { MOVED_TO_ACCOUNT, SETTINGS_SECTIONS, settingsSectionFor, visibleSettingsSections } from '../sections'
import { PAGE_KEYS } from '@/router/printerSections'

const simple = { pro: false, components: ['update_manager', 'muon_access'] }
const pro = { pro: true, components: ['update_manager', 'muon_access', 'timelapse'] }

const ids = (c: typeof simple) => visibleSettingsSections(c).map(s => s.id)

describe("Settings' sections", () => {
  it('shows every settings section with the legacy Pro value off or on', () => {
    const expected = [
      'general', 'network', 'access', 'updates', 'cameras', 'materials', 'macros',
      'console', 'files', 'toolhead', 'gcodePreview', 'developer', 'system'
    ]
    expect(ids(simple)).toEqual(expected)
    expect(ids({ ...simple, pro: true })).toEqual(expected)
  })

  it('adds only the sections backed by printer capabilities', () => {
    expect(ids(pro)).toEqual([
      'general', 'network', 'access', 'updates', 'cameras', 'materials', 'macros', 'timelapse',
      'console', 'files', 'toolhead', 'gcodePreview', 'developer', 'system'
    ])
  })

  it('leave out Updates and People without the printer parts behind them', () => {
    expect(ids({ pro: false, components: [] })).not.toContain('updates')
    expect(ids({ pro: false, components: [] })).not.toContain('access')
  })

  it('open from any of their cards\' anchors', () => {
    const sections = visibleSettingsSections(pro)
    expect(settingsSectionFor('#theme', sections)?.id).toBe('general')
    expect(settingsSectionFor('#auth', sections)?.id).toBe('access')
    expect(settingsSectionFor('#editor', sections)?.id).toBe('files')
  })

  it('open nothing for no anchor, or a section not shown', () => {
    expect(settingsSectionFor('', visibleSettingsSections(simple))).toBeNull()
    expect(settingsSectionFor('#console', visibleSettingsSections(simple))?.id).toBe('console')
  })

  it("hold G U's anchor, so the key opens Updates", () => {
    const updates = PAGE_KEYS.find(k => k.key === 'u')!
    expect(settingsSectionFor(updates.hash!, visibleSettingsSections(simple))?.id).toBe('updates')
  })

  it("send the Library's old address to the account, where its settings are now (KAN-532)", () => {
    expect(SETTINGS_SECTIONS.map(s => s.id)).not.toContain('library')
    expect(settingsSectionFor('#library', visibleSettingsSections(pro))).toBeNull()
    expect(MOVED_TO_ACCOUNT.library).toBe('/account/library')
  })

  it('give every card one home', () => {
    const anchors = SETTINGS_SECTIONS.flatMap(s => s.anchors)
    expect(new Set(anchors).size).toBe(anchors.length)
  })
})
