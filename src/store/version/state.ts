import type { VersionState } from './types'

export const defaultState = (): VersionState => {
  return {
    busy: false, // busy doing an update.
    github_limit_reset_time: 0,
    github_rate_limit: 0,
    github_requests_remaining: 0,
    responses: [],
    version_info: {}
  }
}

export const state = defaultState()
