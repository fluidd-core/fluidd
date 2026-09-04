import type { AnnouncementsState } from './types'

export const state = (): AnnouncementsState => {
  return {
    entries: [],
    feeds: []
  }
}
