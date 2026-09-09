import vuetify, { loadVuetifyLocaleAsync } from '../vuetify'

describe('loadVuetifyLocaleAsync', () => {
  const { lang } = vuetify.framework

  beforeEach(() => {
    lang.current = 'en'
  })

  it.each([
    ['de', 'Schließen'],
    ['pt', 'Fechar'],
    ['pt_BR', 'Fechar'],
    ['zh-CN', '关闭'],
    ['zh-HK', '關閉']
  ])('loads and applies the vuetify locale (%s)', async (locale, close) => {
    await loadVuetifyLocaleAsync(locale)

    expect(lang.current).toBe(locale)
    expect(lang.t('$vuetify.close')).toBe(close)
  })

  it('falls back to english when the locale has no vuetify translation', async () => {
    await loadVuetifyLocaleAsync('pt')
    await loadVuetifyLocaleAsync('ta')

    expect(lang.current).toBe('en')
    expect(lang.t('$vuetify.close')).toBe('Close')
  })

  it('does not reload an already loaded locale', async () => {
    await loadVuetifyLocaleAsync('fr')

    const messages = lang.locales.fr

    await loadVuetifyLocaleAsync('en')
    await loadVuetifyLocaleAsync('fr')

    expect(lang.locales.fr).toBe(messages)
  })
})
