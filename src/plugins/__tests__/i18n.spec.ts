import { getStartingLocale } from '../i18n'

describe('getStartingLocale', () => {
  const originalLanguages = Object.getOwnPropertyDescriptor(navigator.constructor.prototype, 'languages')

  const setNavigatorLanguages = (languages: string[]) => {
    Object.defineProperty(navigator, 'languages', {
      configurable: true,
      value: languages
    })
  }

  afterEach(() => {
    if (originalLanguages) {
      Object.defineProperty(navigator.constructor.prototype, 'languages', originalLanguages)
    }

    Reflect.deleteProperty(navigator, 'languages')
  })

  it.each([
    [['zh-CN', 'en-US'], 'zh-CN'],
    [['zh-HK'], 'zh-HK'],
    [['de'], 'de'],
    [['fr-CA'], 'fr']
  ])('matches the full locale code before the language (%j)', (languages, expected) => {
    setNavigatorLanguages(languages)

    expect(getStartingLocale()).toBe(expected)
  })

  it('falls back to the language when the full code is unsupported', () => {
    setNavigatorLanguages(['pt-BR'])

    expect(getStartingLocale()).toBe('pt')
  })

  it('normalizes the casing of the matched code', () => {
    setNavigatorLanguages(['zh-hk'])

    expect(getStartingLocale()).toBe('zh-HK')
  })

  it.each([
    [['pt_BR'], 'pt'],
    [['zh_CN'], 'zh-CN']
  ])('takes the underscore form of a locale code (%j)', (languages, expected) => {
    setNavigatorLanguages(languages)

    expect(getStartingLocale()).toBe(expected)
  })

  it('walks the preferences in order until one is supported', () => {
    setNavigatorLanguages(['nb-NO', 'de-DE'])

    expect(getStartingLocale()).toBe('de')
  })

  it.each([
    [['xx-YY']],
    [[]]
  ])('falls back to english when nothing is supported (%j)', (languages) => {
    setNavigatorLanguages(languages)

    expect(getStartingLocale()).toBe('en')
  })
})
