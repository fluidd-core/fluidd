import { formatThermalTooltip, type ThermalTooltipContext } from '../thermal-tooltip-formatter'

const KEY = 'temperature_sensor chamber'

const ctx = (aliases: Record<string, string> = {}): ThermalTooltipContext => ({
  aliases,
  prettyCase: (v: string) => `p:${v}`,
  fontColor: '#000',
  fontSize: 14,
})

const param = (overrides: Record<string, any> = {}) => ({
  seriesName: KEY,
  marker: '<span></span>',
  value: { [KEY]: 42.5 },
  ...overrides,
})

describe('formatThermalTooltip', () => {
  it('returns empty string for non-array params', () => {
    expect(formatThermalTooltip({}, ctx())).toBe('')
  })

  it('shows the alias in the tooltip when one is set (AC1)', () => {
    const html = formatThermalTooltip([param()], ctx({ [KEY]: 'Chamber' }))
    expect(html).toContain('Chamber:')
  })

  it('falls back to the default label for an EMPTY-string alias (|| not ??)', () => {
    const html = formatThermalTooltip([param()], ctx({ [KEY]: '' }))
    expect(html).toContain('p:chamber:')
  })

  it('HTML-escapes a malicious alias — no live markup reaches the sink (AC6)', () => {
    const html = formatThermalTooltip([param()], ctx({ [KEY]: '<img src=x onerror=alert(1)>' }))
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
    expect(html).not.toContain('<img src=x')
  })

  it('renders the temperature value', () => {
    const html = formatThermalTooltip([param()], ctx())
    expect(html).toContain('42.50')
  })
})
