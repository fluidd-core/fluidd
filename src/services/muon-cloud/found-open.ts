import type { CloudPrinter } from './api'
import type { DirectoryEntry } from './directory'

/**
 * How a found-nearby tile opens on a page that may not reach the LAN (KAN-932).
 *
 * From an https page the browser blocks the printer's `http://` address as
 * mixed content, so a tile linked to an account must go through the account:
 * the relay when signed in, the sign-in dialog when not. Anything else keeps
 * the local way (an http page, an unlinked printer, another account's).
 */
export type FoundOpen =
  | { kind: 'local' }
  | { kind: 'relay', printerId: string }
  | { kind: 'sign-in' }

export function foundOpenFor (
  entry: Pick<DirectoryEntry, 'endpointId' | 'row' | 'lan'>,
  accountPrinters: Array<Pick<CloudPrinter, 'id'>>,
  signedIn: boolean,
  protocol: string = window.location.protocol
): FoundOpen {
  if (protocol !== 'https:') return { kind: 'local' }
  const row = entry.row
  if (!row || row.action !== 'open' || !row.linked) return { kind: 'local' }
  const id = row.cloudId ?? entry.lan?.endpointId ?? entry.endpointId
  if (!id) return { kind: 'local' }
  if (accountPrinters.some(p => p.id === id)) return { kind: 'relay', printerId: id }
  // Linked, but this page has no account to look in: sign in, then it is found.
  if (!signedIn) return { kind: 'sign-in' }
  return { kind: 'local' }
}
