// Intl formatters are expensive to build, so reuse them
const createFormatCache = <TFormat, TOptions>(create: (locales: Intl.LocalesArgument, options: TOptions) => TFormat) => {
  const cache = new Map<string, TFormat>()

  return (locales: Intl.LocalesArgument, options: TOptions): TFormat => {
    const key = JSON.stringify([locales, options])

    let format = cache.get(key)

    if (!format) {
      format = create(locales, options)

      cache.set(key, format)
    }

    return format
  }
}

export const getDateTimeFormat = createFormatCache((locales, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locales, options))

export const getRelativeTimeFormat = createFormatCache((locales, options: Intl.RelativeTimeFormatOptions) => new Intl.RelativeTimeFormat(locales, options))

export const getNumberFormat = createFormatCache((locales, options: Intl.NumberFormatOptions) => new Intl.NumberFormat(locales, options))
