import escapeHtml from './escape-html'

// ECharts appends these suffixes to derived series (target/power/speed lines).
const SERIES_SUFFIX = /(#target|#power|#speed)$/

/**
 * Resolve the display label for a chart series, applying a user alias if one
 * exists, then HTML-escaping the result for safe insertion into the tooltip's
 * raw-HTML string.
 *
 * @param seriesKey    The ECharts series name = the raw printer-state key,
 *                     possibly with a `#target`/`#power`/`#speed` suffix.
 * @param aliases      The alias map (`objectKey -> friendlyName`).
 * @param defaultLabel The pre-alias label to fall back to.
 *
 * Uses `||` (not `??`) so a stored empty-string alias falls through to the
 * default, matching the getters' `alias || default` resolution.
 */
const resolveAliasLabel = (
  seriesKey: string,
  aliases: Record<string, string>,
  defaultLabel: string
): string => {
  const objectKey = seriesKey.replace(SERIES_SUFFIX, '')
  const raw = aliases[objectKey] || defaultLabel

  return escapeHtml(raw)
}

export default resolveAliasLabel
