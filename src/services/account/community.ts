import { accountRequest } from './client'
import { modelsAssertion } from '@/services/library/assertion'
import { MODELS_URL, libraryErrorFrom } from '@/services/library/api'

export interface CommunityIdentity {
  declared_age: number | null;
  declared_at: number | null;
  can_community: boolean;
  can_public: boolean;
  identity_public: boolean;
  revision: number;
  projection_pending: boolean;
}
export interface CommunityProfile {
  handle: string | null;
  public_name: string | null;
  identity_public: boolean;
  can_community: boolean;
  can_public: boolean;
  page_on: boolean;
  bio: string | null;
}
async function models<T> (method: string, path: string, body?: unknown): Promise<T> {
  const proof = await modelsAssertion.get()
  const response = await fetch(`${MODELS_URL}${path}`, {
    method,
    credentials: 'omit',
    cache: 'no-store',
    headers: { authorization: `Bearer ${proof}`, 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  const data = await response.json()
  if (!response.ok) {
    if (response.status === 401) modelsAssertion.drop()
    throw libraryErrorFrom(response.status, data)
  }
  return data as T
}
export const communityApi = {
  identity: () => accountRequest<CommunityIdentity>('GET', '/v1/me/community-identity'),
  saveIdentity: (body: { declared_age?: number, identity_public?: boolean }) => accountRequest<CommunityIdentity>('PATCH', '/v1/me/community-identity', body),
  profile: () => models<CommunityProfile>('GET', '/v1/community/profile'),
  claim: (handle: string) => models<CommunityProfile>('PUT', '/v1/community/profile/handle', { handle })
}
