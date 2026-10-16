export interface NudgeContext { m1: boolean; layer: number; printing: boolean; ready: boolean; homed: boolean; waiting: boolean; identity: string }
export function firstLayerAllowed (value: NudgeContext): boolean {
  return value.m1 && Number.isInteger(value.layer) && value.layer >= 1 && value.layer <= 3 && value.printing && value.ready && value.homed && !value.waiting && !!value.identity
}
export interface NudgeBudget { spent: number; total: number }
export function readNudge (storage: Pick<Storage, 'getItem'>, key: string): NudgeBudget | null {
  try {
    const value = JSON.parse(storage.getItem(`muon.first-layer.v1.${key}`) ?? '{"spent":0,"total":0}') as NudgeBudget
    return Number.isFinite(value.spent) && Number.isFinite(value.total) && value.spent >= 0 && value.spent <= 0.1 && Math.abs(value.total) <= value.spent + 1e-8 ? value : null
  } catch { return null }
}
export function reserveNudge (storage: Pick<Storage, 'getItem' | 'setItem'>, key: string, by: number): NudgeBudget | null {
  if (!key || ![-0.01, 0.01].includes(by)) return null
  const current = readNudge(storage, key)
  if (!current || Math.round(current.spent * 100) >= 10) return null
  const next = { spent: Math.round(current.spent * 100 + 1) / 100, total: Math.round((current.total + by) * 100) / 100 }
  try { storage.setItem(`muon.first-layer.v1.${key}`, JSON.stringify(next)); return next } catch { return null }
}
