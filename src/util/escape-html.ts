// The single HTML-escaping implementation. Used to neutralise user-supplied
// display-name aliases before they reach a raw-HTML sink (ECharts tooltip
// formatter, v-safe-html labels). `&` MUST be replaced first.
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export default escapeHtml
