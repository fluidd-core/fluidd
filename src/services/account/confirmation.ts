import { accountRequest, AccountError } from './client'
import { storedToken } from '@/services/muon-cloud/api'
import { usePasskey } from './webauthn'

/** Ordinary account confirmation on cloud #36. This never grants staff authority. */
export async function confirmAccount (current: () => boolean = () => true): Promise<void> {
  const token = storedToken()
  const check = () => {
    if (!token || storedToken() !== token || !current()) throw new AccountError('The account changed. Open this action again.', 401)
  }
  check()
  const options = await accountRequest<{ ceremony_id: string; options: { publicKey: Record<string, any> }; expires_at: number }>('POST', '/v1/me/reauth/passkey/options', {}, { token })
  const fresh = () => {
    check()
    if (!Number.isFinite(options.expires_at) || options.expires_at * 1000 <= Date.now()) throw new AccountError('Passkey confirmation expired. Try again.', 403)
  }
  fresh()
  const credential = await usePasskey(options.options.publicKey)
  fresh()
  await accountRequest('POST', '/v1/me/reauth/passkey', { ceremony_id: options.ceremony_id, credential }, { token })
  fresh()
}
