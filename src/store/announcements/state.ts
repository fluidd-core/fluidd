import { AnnouncementsState } from './types'

export const defaultState = (): AnnouncementsState => {
  return {
    entries: [],
    feeds: []
  }
}

export const state = defaultState()
