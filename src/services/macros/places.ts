import { httpClientActions } from '@/api/httpClientActions'
import { configFilesToRead, macroPlaces, type MacroPlace } from './locate'

interface ListedFile {
  path: string;
  size?: number;
  modified?: number;
}

/** What was read last, per root, kept while the files are unchanged. */
const cache = new Map<string, { stamp: string, places: Map<string, MacroPlace> }>()

/**
 * Where every macro is written in `root` (`config` when developer mode is
 * on, else the read-only `defaults`): the printer's .cfg files are listed,
 * then read, and each [gcode_macro] found. Read again only when a file
 * changed.
 */
export async function macroPlacesOn (root: string): Promise<Map<string, MacroPlace>> {
  const listed = await httpClientActions.get<{ result: ListedFile[] }>(`/server/files/list?root=${encodeURIComponent(root)}`)
  const files = listed.data?.result ?? []
  const paths = configFilesToRead(files)
  const stamp = paths.map(p => `${p}:${files.find(f => f.path === p)?.modified ?? ''}`).join('|')
  const hit = cache.get(root)
  if (hit && hit.stamp === stamp) return hit.places
  const read = await Promise.all(paths.map(async path => {
    try {
      const response = await httpClientActions.serverFilesGet<string>(`${root}/${path}`, { responseType: 'text', transformResponse: [v => v] })
      return { path, content: String(response.data ?? '') }
    } catch {
      return { path, content: '' }
    }
  }))
  const places = macroPlaces(root, read)
  cache.set(root, { stamp, places })
  return places
}
