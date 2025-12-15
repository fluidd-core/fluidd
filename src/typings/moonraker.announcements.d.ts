declare namespace Moonraker.Announcements {
  export interface ListResponse {
    entries: Entry[];
    feeds: string[];
  }

  export interface DismissResponse {
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
