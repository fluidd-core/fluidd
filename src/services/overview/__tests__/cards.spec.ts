import { expect, it } from 'vitest'
import { cardLayout, moveCard, overviewCards } from '../cards'

it('keeps fixed printer, print and actions outside the optional layout and resets to useful defaults', () => {
  expect(cardLayout(null)).toEqual(['temperatures', 'quick-actions', 'queue'])
  expect(cardLayout(['stage', 'print', 'pause', 'stop', 'console', 'console', 'bogus'])).toEqual(['console'])
  expect(cardLayout([])).toEqual([])
  expect(moveCard(['console', 'camera', 'queue'], 'queue', -1)).toEqual(['console', 'queue', 'camera'])
  expect(moveCard(['console'], 'stage', -1)).toEqual(['console'])
  expect(overviewCards.find(c => c.id === 'objects')?.needs).toContain('exclude_object')
})
