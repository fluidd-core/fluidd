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
  date: Date
  dismissed: boolean
  date_dismissed: Date | null
  dismiss_wake: Date | null
  source: AnnouncementSource | string
  feed: string
}

export type AnnouncementPriority = 'normal' | 'high'
export type AnnouncementSource = 'moonlight' | 'internal'
