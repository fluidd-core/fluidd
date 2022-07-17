export interface AnnouncementsState {
  entries: Announcement[]
  feeds: string[]
}

export interface Announcement {
  entry_id: string
  url: string
  title: string
  description: string
  priority: AnnouncementPriority
  date: number
  dismissed: boolean
  date_dismissed: number | null
  dismiss_wake: number | null
  source: AnnouncementSource | string
  feed: string
}

export type AnnouncementPriority = 'normal' | 'high'
export type AnnouncementSource = 'moonlight' | 'internal'
