/**
 * The Library's list, kept in step with `GET /v1/items?since=<rev>`: each
 * page is the changes after `rev`, in rev order, a deleted print as a
 * tombstone (its id and rev, nothing else). A page marked `reset` answers a
 * `since` older than the oldest tombstone the service kept: it starts the
 * whole list again, so anything not in it is gone. `more` says to ask again
 * from the page's `rev`.
 */
import type { FeedPage, LibraryItem } from './api'

export interface FeedState {
  items: Record<string, LibraryItem>;
  rev: number;
}

/** The list after one page. */
export function applyFeedPage (state: FeedState, page: FeedPage): FeedState {
  const items = page.reset ? {} : { ...state.items }
  for (const item of page.items) {
    if (item.state === 'deleted') delete items[item.id]
    else items[item.id] = item
  }
  return { items, rev: page.rev }
}

/** How many pages one sync reads at most, so a service that keeps saying `more` can't hold it. */
export const MAX_PAGES = 50

/** Reads every page after `state.rev` and answers the list they make. */
export async function syncFeed (state: FeedState, page: (since: number) => Promise<FeedPage>): Promise<FeedState> {
  let next = state
  for (let i = 0; i < MAX_PAGES; i++) {
    const answer = await page(next.rev)
    next = applyFeedPage(next, answer)
    if (!answer.more) break
  }
  return next
}
