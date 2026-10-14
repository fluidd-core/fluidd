export interface PrinterNameParts {
  /** The name people use: Boxwood, Workshop One. */
  name: string;
  /** The four characters that tell two printers of one name apart (367A), when the name has them. */
  suffix: string | null;
}

const MUON_NAME = /^muon-([a-z0-9][a-z0-9-]*)-([0-9a-f]{4})$/i
const SLUG_NAME = /^([a-z][a-z0-9]*(?:-[a-z0-9]+)*)-([0-9a-f]{4})$/

function titleWords (words: string): string {
  return words.split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

/**
 * A printer's name as the header and the switcher show it. A Muon3D
 * printer's network name (muon-boxwood-367a) or its address (boxwood-367a)
 * becomes Boxwood with 367A beside it; a name someone typed stays as typed.
 */
export function printerNameParts (raw: string): PrinterNameParts {
  const text = raw.trim()
  const m = MUON_NAME.exec(text) ?? SLUG_NAME.exec(text)
  if (!m) return { name: text, suffix: null }
  return { name: titleWords(m[1]), suffix: m[2].toUpperCase() }
}
