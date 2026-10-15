/**
 * The part's picture for a printer Fluidd is not on: the thumbnail the slicer
 * put in the job's G-code, read from that printer once per file, through
 * whatever reaches it (this network, or Muon3D).
 *
 * Read as bytes and shown from an object URL, not linked: a page served over
 * HTTPS (app.muon3d.com) may not load a plain-HTTP picture from a printer by
 * its `.local` name, and a cloud printer has no address at all.
 */
import Vue from 'vue'

/** How a picture's printer is asked: a path such as `/server/files/metadata?filename=…`. */
export type PrinterRead = (path: string) => Promise<Response>

export const jobPictures = Vue.observable({
  /** By printer and file: an object URL, or null when the job has none (or it couldn't be read). */
  urls: {} as Record<string, string | null>
})

const reading = new Map<string, Promise<void>>()

interface Thumbnail {
  width?: number;
  relative_path?: string;
}

/** The thumbnail to show on a card: the largest up to 400 px, else the smallest larger one. */
export function cardThumbnail (thumbnails: Thumbnail[] | undefined): Thumbnail | null {
  const usable = (thumbnails ?? []).filter(t => typeof t.relative_path === 'string' && t.relative_path)
  if (!usable.length) return null
  const bySize = [...usable].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
  return [...bySize].reverse().find(t => (t.width ?? 0) <= 400) ?? bySize[0]
}

/** Where a job's thumbnail is: beside the job, in its own folder (`.thumbs/…`). */
export function thumbnailPath (filename: string, relativePath: string): string {
  const folder = filename.includes('/') ? filename.slice(0, filename.lastIndexOf('/') + 1) : ''
  return `/server/files/gcodes/${`${folder}${relativePath}`.split('/').map(encodeURIComponent).join('/')}`
}

async function load (key: string, filename: string, read: PrinterRead) {
  try {
    const answer = await read(`/server/files/metadata?filename=${encodeURIComponent(filename)}`)
    if (!answer.ok) throw new Error(`HTTP ${answer.status}`)
    const thumbnail = cardThumbnail((await answer.json())?.result?.thumbnails)
    if (!thumbnail?.relative_path) {
      Vue.set(jobPictures.urls, key, null)
      return
    }
    const picture = await read(thumbnailPath(filename, thumbnail.relative_path))
    if (!picture.ok) throw new Error(`HTTP ${picture.status}`)
    Vue.set(jobPictures.urls, key, URL.createObjectURL(await picture.blob()))
  } catch {
    Vue.set(jobPictures.urls, key, null)
  }
}

/**
 * The picture of `filename` on the printer `printer` (any key that names it,
 * such as its address), or null until it has been read. The first ask reads
 * it; the answer arrives through `jobPictures`, which is reactive.
 */
export function jobPicture (printer: string, filename: string, read: PrinterRead): string | null {
  const key = `${printer}|${filename}`
  if (key in jobPictures.urls) return jobPictures.urls[key]
  if (!reading.has(key)) {
    reading.set(key, load(key, filename, read).finally(() => reading.delete(key)))
  }
  return null
}
