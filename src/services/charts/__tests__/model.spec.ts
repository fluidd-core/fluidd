import { describe, expect, it } from 'vitest'
import { flattenCharts, formatMetric, layoutFrom, metricValue, moveChart } from '../model'

const chart = (id: string) => ({ id, enabled: true })

describe('the charts\' order', () => {
  it('reads Fluidd\'s columns in turn, container10 after container2', () => {
    const layout = { container10: [chart('z')], container2: [chart('c')], container1: [chart('a'), chart('b')] }
    expect(flattenCharts(layout).map(c => c.id)).toEqual(['a', 'b', 'c', 'z'])
    expect(flattenCharts(undefined)).toEqual([])
  })

  it('writes them back in one column', () => {
    expect(layoutFrom([chart('a')])).toEqual({ container1: [chart('a')], container2: [], container3: [], container4: [] })
  })

  it('moves a chart earlier or later, and not past either end', () => {
    const list = [chart('a'), chart('b'), chart('c')]
    expect(moveChart(list, 'c', -1).map(c => c.id)).toEqual(['a', 'c', 'b'])
    expect(moveChart(list, 'a', 1).map(c => c.id)).toEqual(['b', 'a', 'c'])
    expect(moveChart(list, 'a', -1)).toBe(list)
    expect(moveChart(list, 'nope', 1)).toBe(list)
  })
})

describe('a metric\'s value', () => {
  it('is the latest number for its collector, skipping gaps', () => {
    const points = [{ 'toolhead.velocity': 10 }, { 'toolhead.velocity': '12.5' }, { other: 1 }]
    expect(metricValue(points, 'toolhead.velocity')).toBe(12.5)
    expect(metricValue(points, 'missing')).toBeNull()
  })

  it('shows three places and its unit', () => {
    expect(formatMetric(12.34567, 'mm/s')).toBe('12.346 mm/s')
    expect(formatMetric(3, '')).toBe('3')
    expect(formatMetric(null, 'mm/s')).toBe('—')
  })
})
