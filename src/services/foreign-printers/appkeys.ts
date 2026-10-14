import type { AdapterDeps } from './types'

interface AppKeyRequest {
  app_token: string
}

interface AppKeyResponse {
  api_key: string
}

export async function requestOctoPrintKey (
  host: string,
  deps: Pick<AdapterDeps, 'fetch'>,
  opts: { onPending?: () => void, intervalMs?: number, attempts?: number } = {}
): Promise<string | null> {
  const root = `http://${host}`
  const probe = await deps.fetch(`${root}/plugin/appkeys/probe`, { cache: 'no-store' })
  if (probe.status === 404) return null
  if (!probe.ok) throw new Error(`HTTP ${probe.status}`)

  const request = await deps.fetch(`${root}/plugin/appkeys/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app: 'Muon3D Fluidd' }),
    cache: 'no-store'
  })
  if (request.status !== 201) throw new Error(`HTTP ${request.status}`)
  const { app_token: token } = await request.json() as AppKeyRequest
  opts.onPending?.()

  const intervalMs = opts.intervalMs ?? 1000
  const attempts = opts.attempts ?? 60
  for (let attempt = 0; attempt < attempts; attempt++) {
    if (intervalMs > 0) await new Promise(resolve => setTimeout(resolve, intervalMs))
    const response = await deps.fetch(`${root}/plugin/appkeys/request/${encodeURIComponent(token)}`, { cache: 'no-store' })
    if (response.status === 202) continue
    if (response.status === 404) throw new Error('denied')
    if (response.status === 200) {
      const body = await response.json() as AppKeyResponse
      return body.api_key
    }
    throw new Error(`HTTP ${response.status}`)
  }

  throw new Error('denied')
}
