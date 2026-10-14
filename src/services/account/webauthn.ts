/**
 * Passkeys in the browser (WebAuthn), as the console expects them
 * (`crates/muon-console/src/passkey.rs`): its options come as JSON with
 * binary fields in base64url, and the credential goes back the same way.
 * The relying party is muon3d.com, so this works on control.muon3d.com and
 * app.muon3d.com, never on a printer's own page.
 */

export function toBase64url (buffer: ArrayBuffer | ArrayBufferView): string {
  const bytes = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  let text = ''
  for (const byte of bytes) text += String.fromCharCode(byte)
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromBase64url (text: string): ArrayBuffer {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((text.length + 3) % 4)
  const raw = atob(padded)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes.buffer
}

type Json = Record<string, any>

const credentialList = (list: unknown) => Array.isArray(list)
  ? list.map((c: Json) => ({ ...c, id: fromBase64url(String(c.id)) }))
  : undefined

/** The console's `publicKey` creation options, with their binary fields as bytes. */
export function creationOptions (publicKey: Json): PublicKeyCredentialCreationOptions {
  return {
    ...publicKey,
    challenge: fromBase64url(String(publicKey.challenge)),
    user: { ...publicKey.user, id: fromBase64url(String(publicKey.user?.id ?? '')) },
    excludeCredentials: credentialList(publicKey.excludeCredentials)
  } as PublicKeyCredentialCreationOptions
}

/** The console's `publicKey` request options, with their binary fields as bytes. */
export function requestOptions (publicKey: Json): PublicKeyCredentialRequestOptions {
  return {
    ...publicKey,
    challenge: fromBase64url(String(publicKey.challenge)),
    allowCredentials: credentialList(publicKey.allowCredentials)
  } as PublicKeyCredentialRequestOptions
}

/** A credential as the console reads it: its id, and its response's binary fields in base64url. */
export function credentialJson (credential: PublicKeyCredential): Json {
  const response = credential.response as AuthenticatorAttestationResponse & AuthenticatorAssertionResponse
  const out: Json = { clientDataJSON: toBase64url(response.clientDataJSON) }
  if (response.attestationObject) out.attestationObject = toBase64url(response.attestationObject)
  if (response.authenticatorData) out.authenticatorData = toBase64url(response.authenticatorData)
  if (response.signature) out.signature = toBase64url(response.signature)
  if (response.userHandle) out.userHandle = toBase64url(response.userHandle)
  return { id: credential.id, rawId: toBase64url(credential.rawId), type: credential.type, response: out }
}

/** Whether this browser can make and use passkeys at all. */
export function passkeysSupported (): boolean {
  return typeof window !== 'undefined' && typeof window.PublicKeyCredential === 'function' && !!navigator.credentials
}

/** The person cancelled the browser's passkey sheet (or it timed out): not an error to show. */
export function cancelledPasskey (error: unknown): boolean {
  return error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError')
}

export async function createPasskey (publicKey: Json): Promise<Json> {
  const credential = await navigator.credentials.create({ publicKey: creationOptions(publicKey) }) as PublicKeyCredential | null
  if (!credential) throw new DOMException('No passkey was made.', 'NotAllowedError')
  return credentialJson(credential)
}

export async function usePasskey (publicKey: Json): Promise<Json> {
  const credential = await navigator.credentials.get({ publicKey: requestOptions(publicKey) }) as PublicKeyCredential | null
  if (!credential) throw new DOMException('No passkey was chosen.', 'NotAllowedError')
  return credentialJson(credential)
}

/** A name for a new passkey from the browser it was made in: "Chrome on Windows". */
export function deviceLabel (userAgent: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): string {
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent) ? 'Safari' : 'A browser'
  const system = /iPhone/.test(userAgent)
    ? 'an iPhone'
    : /iPad/.test(userAgent)
      ? 'an iPad'
      : /Android/.test(userAgent)
        ? 'Android'
        : /Mac OS X|Macintosh/.test(userAgent)
          ? 'a Mac'
          : /Windows/.test(userAgent) ? 'Windows' : /Linux/.test(userAgent) ? 'Linux' : ''
  return system ? `${browser} on ${system}` : browser
}
