declare namespace Moonraker.Announcements {
  export interface ListResponse {
    entries: Entry[];
    feeds: string[];
  }

  export interface UpdateEvent {
    entries: Entry[];
  }

  export interface DismissResponse {
    entry_id: string;
  }

  export interface DismissedEvent {
    entry_id: string;
  }

  export interface WakeEvent {
    entry_id: string;
  }

  export interface Entry {
    entry_id: string;
    url: string;
    title: string;
    description: string;
    priority: Priority;
    date: number;
    dismissed: boolean;
    date_dismissed: number | null;
    dismiss_wake: number | null;
    source: string;
    feed: string;
  }

  export type Priority = 'normal' | 'high'
}

declare namespace Moonraker {
  export interface Methods {
    'server.announcements.list': {
      params: {
        include_dismissed?: boolean
      },
      result: Announcements.ListResponse
    },
    'server.announcements.dismiss': {
      params: {
        entry_id: string,
        wake_time?: number
      },
      result: Announcements.DismissResponse
    }
  }

  export interface Notifications {
    notify_announcement_update: [Announcements.UpdateEvent],
    notify_announcement_dismissed: [Announcements.DismissedEvent],
    notify_announcement_wake: [Announcements.WakeEvent]
  }
}
