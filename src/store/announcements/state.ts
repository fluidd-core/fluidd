import type { AnnouncementsState } from './types'

export const createState = (): AnnouncementsState => {
  return {
    entries: [],
    feeds: []
  }
}
