import type { VersionState } from './types'

export const createState = (): VersionState => {
  return {
    status: null,
    responses: [],
  }
}
