/**
 * Each print's picture, as an address an <img> can show: the bucket's
 * presigned URL as it is, or, where the service serves the file itself
 * (`needs_auth`, development), its bytes fetched with the assertion and
 * shown from a blob. One ask per picture; a print whose picture changes
 * (a new version) is asked again.
 */
import Vue from 'vue'
import type { LibraryItem } from './api'
import { libraryClient } from './store'

export const thumbnails = Vue.observable({ urls: {} as Record<string, string> })

const asked = new Set<string>()

export function thumbnailKey (item: Pick<LibraryItem, 'id' | 'thumbnail_file_id' | 'rev'>): string {
  return `${item.id}:${item.thumbnail_file_id ?? item.rev}`
}

export function thumbnailFor (item: LibraryItem): string | null {
  return thumbnails.urls[thumbnailKey(item)] ?? null
}

export function loadThumbnail (item: LibraryItem): void {
  if (!item.has_thumbnail) return
  const key = thumbnailKey(item)
  if (asked.has(key)) return
  asked.add(key)
  ;(async () => {
    const client = libraryClient()
    const transfer = await client.thumbnailUrl(item.id)
    let url = transfer.url
    if (transfer.needs_auth) url = URL.createObjectURL(new Blob([await client.get(transfer)]))
    Vue.set(thumbnails.urls, key, url)
  })().catch(() => {
    // No picture: the card shows its placeholder. Asked again on the next visit.
    asked.delete(key)
  })
}
