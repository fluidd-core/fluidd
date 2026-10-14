/**
 * Whether the browser, not the printer, is what stops this page reaching
 * `apiUrl`. A page served over HTTPS (control.muon3d.com) asking a plain-HTTP
 * printer is mixed content: every browser but Chromium blocks it before it
 * leaves the machine, and Chromium does too until the person allows local
 * network access. The address is then usually right, and the printer's own
 * page works.
 */
export const pageBlocksPrinter = (apiUrl: string, pageProtocol: string = location.protocol): boolean =>
  pageProtocol === 'https:' && /^http:\/\//i.test(apiUrl)

/** The printer's own page, for an API address such as `http://192.168.1.153`. */
export const printerPageUrl = (apiUrl: string): string => `${apiUrl.replace(/\/+$/, '')}/`

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}

/** Text made safe to put inside HTML, including an attribute value. */
export const escapeHtml = (text: string): string => text.replace(/[&<>"']/g, c => HTML_ESCAPES[c])
