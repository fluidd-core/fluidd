import type { VersionState } from './types'

export const state = (): VersionState => {
  return {
    status: null,
    responses: [],
  }
}
