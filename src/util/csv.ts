const formulaPrefixRegExp = /^[=+\-@\t\r]/
const needsQuotingRegExp = /[",\r\n]/

const pad = (value: number) => value.toString().padStart(2, '0')

// Local time, in the one date format spreadsheets parse regardless of locale.
const formatDateTime = (date: Date) => (
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
)

const toText = (value: unknown): string => {
  if (value == null) {
    return ''
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? ''
      : formatDateTime(value)
  }

  if (Array.isArray(value)) {
    return value
      .map(toText)
      .join('; ')
  }

  return String(value)
}

// A string that a spreadsheet would evaluate as a formula; numbers are left
// alone so negative values still sum.
const isFormulaLike = (value: unknown): boolean => (
  Array.isArray(value)
    ? isFormulaLike(value[0])
    : (
        typeof value === 'string' &&
        formulaPrefixRegExp.test(value)
      )
)

const toCsvCell = (value: unknown): string => {
  const text = isFormulaLike(value)
    ? `'${toText(value)}`
    : toText(value)

  return needsQuotingRegExp.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text
}

/**
 * Builds RFC 4180 CSV content from rows of cells.
 */
const toCsv = (rows: unknown[][]): string => rows
  .map(row => row
    .map(toCsvCell)
    .join(',')
  )
  .join('\r\n')

export default toCsv
