import {
  isReservedNavLinkId,
  isSafeNavLinkUrl,
  isWithinNavLinkDataUriLimit,
  resolveNavLinkNewTab,
  MAX_NAV_LINK_DATA_URI_LENGTH,
  THEME_LINK_ID_PREFIX
} from '../nav-link'

describe('isReservedNavLinkId', () => {
  it.each([
    [`${THEME_LINK_ID_PREFIX}logo_voron.svg`, true],
    ['preset-anything', true],
    ['1c5f-uuid', false],
    ['', false],
    [undefined, false]
  ])('treats "%s" reserved=%s', (id, expected) => {
    expect(isReservedNavLinkId(id as string | undefined)).toBe(expected)
  })
})

describe('isSafeNavLinkUrl', () => {
  it.each([
    ['https://example.com', true],
    ['http://printer.local/spoolman', true],
    ['/klipperfleet.html', true],
    ['javascript:alert(1)', false],
    ['  JavaScript:alert(1)', false],
    ['data:text/html,<script>', false],
    ['vbscript:msgbox', false],
    ['', false],
    ['   ', false],
    [undefined, false]
  ])('treats "%s" safe=%s', (url, expected) => {
    expect(isSafeNavLinkUrl(url as string | undefined)).toBe(expected)
  })
})

describe('isWithinNavLinkDataUriLimit', () => {
  it('accepts non-string values', () => {
    expect(isWithinNavLinkDataUriLimit(undefined)).toBe(true)
  })

  it('accepts strings within the limit', () => {
    expect(isWithinNavLinkDataUriLimit('a'.repeat(MAX_NAV_LINK_DATA_URI_LENGTH))).toBe(true)
  })

  it('rejects strings over the limit', () => {
    expect(isWithinNavLinkDataUriLimit('a'.repeat(MAX_NAV_LINK_DATA_URI_LENGTH + 1))).toBe(false)
  })
})

describe('resolveNavLinkNewTab', () => {
  it.each([
    ['new-tab', true],
    ['same-tab', false],
    [undefined, true]
  ] as const)('target=%s => newTab=%s', (target, expected) => {
    expect(resolveNavLinkNewTab(target as never)).toBe(expected)
  })
})
