import escapeHtml from './escape-html'

/**
 * Build the HTML `label` for an output widget (fan / pin / LED).
 *
 * The label is rendered via `v-safe-html` (DOMPurify) inside AppNamedSlider /
 * AppNamedSwitch, so a raw `<` in a user alias would survive as markup. Escape
 * the (possibly aliased) display name before composing the optional rpm suffix,
 * which is app-generated and therefore trusted.
 */
const buildOutputLabel = (prettyName: string, rpm?: string): string => {
  const name = escapeHtml(prettyName)

  return rpm
    ? `${name} <small>${rpm}</small>`
    : name
}

export default buildOutputLabel
