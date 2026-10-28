/**
 * Discover in Control (KAN-735): the public prints the Library's own Discover
 * page shows, from the same `GET /v1/public/discover`, so Control's Library
 * and library.muon3d.com open on the same shelves. It needs no account and
 * sends no assertion: everything in it is public.
 *
 * A card opens on library.muon3d.com, where a print can be downloaded, made
 * and remixed; it links where the Library's own Discover links
 * (web/src/discover-v2.ts). The answer's shape is the model service's
 * `src/public_v2.rs` (`discover`, `summary`); `thumbnail_url` is optional:
 * publication summaries carry it from KAN-395 on.
 */
import { MODELS_URL } from './api'

/** The standalone Library, where a public print has its page. */
export const LIBRARY_URL: string = (import.meta.env.VITE_LIBRARY_URL || 'https://library.muon3d.com').replace(/\/+$/, '')

export interface DiscoverPublication {
  id: string;
  slug: string;
  title: string;
  category: string;
  creator: { handle: string | null, display_name: string | null };
  thumbnail_url?: string | null;
  make_count?: number;
  created_at: string;
}

/** A print Muon3D tested on an M1 (`catalogue.items`). */
export interface DiscoverCatalogue {
  slug: string;
  title: string;
  summary?: string | null;
  author: string;
  thumbnail_url?: string | null;
  print_time_s?: number | null;
  filament_g?: number | null;
  material?: string | null;
}

export interface DiscoverFeed {
  m1_ready: DiscoverCatalogue[];
  trending: DiscoverPublication[];
  new: DiscoverPublication[];
}

/** One card, whichever shelf it came from: what LibraryDiscover draws. */
export interface DiscoverCard {
  key: string;
  title: string;
  byline: string;
  facts: string;
  picture: string | null;
  href: string;
  tested: boolean;
}

/** Only an https picture, or one from the model service: no `javascript:` or `data:`. */
export function safePicture (value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value, MODELS_URL)
    return url.protocol === 'https:' || url.origin === new URL(MODELS_URL).origin ? url.href : null
  } catch {
    return null
  }
}

function minutes (seconds: number): string {
  const total = Math.max(1, Math.round(seconds / 60))
  if (total < 60) return `${total} min`
  return total % 60 ? `${Math.floor(total / 60)} h ${total % 60} min` : `${Math.floor(total / 60)} h`
}

function byline (creator: DiscoverPublication['creator']): string {
  return creator.handle ? `@${creator.handle}` : creator.display_name || 'Muon3D maker'
}

export function catalogueCard (item: DiscoverCatalogue): DiscoverCard {
  const facts = [
    item.print_time_s ? minutes(item.print_time_s) : '',
    item.filament_g ? `${Math.round(item.filament_g)} g` : '',
    item.material ?? ''
  ].filter(Boolean).join(' · ')
  return {
    key: `m1:${item.slug}`,
    title: item.title,
    byline: item.author,
    facts,
    picture: safePicture(item.thumbnail_url),
    // A catalogue entry is not a publication: `/p/` would not find it.
    href: `${LIBRARY_URL}/search?q=${encodeURIComponent(item.title)}&sources=muon3d`,
    tested: true
  }
}

export function publicationCard (item: DiscoverPublication): DiscoverCard {
  const makes = item.make_count ?? 0
  return {
    key: `pub:${item.id}`,
    title: item.title,
    byline: byline(item.creator),
    facts: makes ? `${makes} ${makes === 1 ? 'make' : 'makes'}` : '',
    picture: safePicture(item.thumbnail_url),
    href: `${LIBRARY_URL}/p/${encodeURIComponent(item.slug)}`,
    tested: false
  }
}

export interface DiscoverShelf {
  id: 'm1' | 'trending' | 'new';
  title: string;
  cards: DiscoverCard[];
}

const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0

function isCatalogue (item: unknown): item is DiscoverCatalogue {
  const value = item as DiscoverCatalogue | null
  return !!value && text(value.slug) && text(value.title)
}

function isPublication (item: unknown): item is DiscoverPublication {
  const value = item as DiscoverPublication | null
  return !!value && text(value.id) && text(value.slug) && text(value.title) &&
    typeof value.creator === 'object' && value.creator !== null
}

/**
 * The shelves in the Library's order (M1, Trending, New), without an empty
 * one, and without an item it can't draw. A print can be on two shelves, as
 * on the Library, but never twice on one.
 */
export function discoverShelves (feed: DiscoverFeed): DiscoverShelf[] {
  const once = (cards: DiscoverCard[]) => cards.filter((card, index) => cards.findIndex(other => other.key === card.key) === index)
  const shelves: DiscoverShelf[] = [
    { id: 'm1', title: 'Print-ready on M1', cards: once(feed.m1_ready.filter(isCatalogue).map(catalogueCard)) },
    { id: 'trending', title: 'Trending in Community', cards: once(feed.trending.filter(isPublication).map(publicationCard)) },
    { id: 'new', title: 'New this week', cards: once(feed.new.filter(isPublication).map(publicationCard)) }
  ]
  return shelves.filter(shelf => shelf.cards.length > 0)
}

/** Reads Discover. Anything but a readable answer is an error the page shows with Try again. */
export async function loadDiscover (fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<DiscoverFeed> {
  const response = await fetcher(`${MODELS_URL}/v1/public/discover`, { method: 'GET', credentials: 'omit', signal })
  if (!response.ok) throw new Error(response.status === 404 ? 'Discover isn\'t open yet.' : 'Discover didn\'t answer. Try again.')
  const unreadable = 'Discover sent an answer this version of Control can\'t read.'
  const body = await response.json().catch(() => { throw new Error(unreadable) }) as Partial<DiscoverFeed> | null
  if (!body || !Array.isArray(body.m1_ready) || !Array.isArray(body.trending) || !Array.isArray(body.new)) {
    throw new Error(unreadable)
  }
  return { m1_ready: body.m1_ready, trending: body.trending, new: body.new }
}
