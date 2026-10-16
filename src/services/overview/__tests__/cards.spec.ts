import { expect, it } from 'vitest'
import { cardLayout, cardUnavailable, moveCard, overviewCards, type OverviewCapabilities } from '../cards'

it('keeps fixed printer, print and actions outside the optional layout and resets to useful defaults', () => {
  expect(cardLayout(null)).toEqual(['temperatures', 'quick-actions', 'queue'])
  expect(cardLayout(['stage', 'print', 'pause', 'stop', 'console', 'console', 'bogus'])).toEqual(['console'])
  expect(cardLayout([])).toEqual([])
  expect(moveCard(['console', 'camera', 'queue'], 'queue', -1)).toEqual(['console', 'queue', 'camera'])
  expect(moveCard(['console'], 'stage', -1)).toEqual(['console'])
  expect(overviewCards.find(c => c.id === 'objects')?.needs).toContain('exclude_object')
})

it('gives every optional card one capability decision and a plain refusal', () => {
  const supported: OverviewCapabilities = {
    temperatures: true, control: true, queue: true, camera: true, macros: true,
    nativeConnection: true, bedMesh: true, calibration: true, diagnostics: true,
    objects: true, filament: true
  }
  for (const card of overviewCards) {
    expect(cardUnavailable(card.id, supported), card.id).toBeUndefined()
    const capability = card.capability
    expect(cardUnavailable(card.id, { ...supported, [capability]: false }), card.id).toMatch(/\S+[.!]$/)
  }
})
