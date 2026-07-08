import resolveAliasLabel from '../resolve-alias-label'

const KEY = 'output_pin fan2'

describe('resolveAliasLabel', () => {
  it('returns the alias (escaped) when one is set', () => {
    expect(resolveAliasLabel(KEY, { [KEY]: 'Side Fan' }, 'Default')).toBe('Side Fan')
  })

  it('falls back to the (escaped) default when no alias is set', () => {
    expect(resolveAliasLabel(KEY, {}, 'Default')).toBe('Default')
  })

  it('falls back to the default for an empty-string alias (|| not ??)', () => {
    // Guards the blank-tooltip class of bug: an empty alias must not blank the label.
    expect(resolveAliasLabel(KEY, { [KEY]: '' }, 'Default')).toBe('Default')
  })

  it.each(['#target', '#power', '#speed'])('strips the %s series suffix before lookup', (suffix) => {
    expect(resolveAliasLabel(`${KEY}${suffix}`, { [KEY]: 'Side Fan' }, 'Default')).toBe('Side Fan')
  })

  it('HTML-escapes a malicious alias', () => {
    expect(resolveAliasLabel(KEY, { [KEY]: '<img src=x onerror=alert(1)>' }, 'Default'))
      .toBe('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('HTML-escapes a malicious default label too', () => {
    expect(resolveAliasLabel(KEY, {}, '<script>')).toBe('&lt;script&gt;')
  })
})
