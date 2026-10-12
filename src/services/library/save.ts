/**
 * Saving a print, or a new version of one (KAN-521):
 *
 * 1. the consent first, when the person gave it on the slicer's card;
 * 2. the files declared, each by its stored size and SHA-256: the project
 *    (.3mf) as it is, each G-code gzip-compressed, the picture as it is;
 * 3. `POST /v1/prints` for a new print, or `POST /v1/items/{id}/versions`;
 * 4. a PUT for each file the service asks for: files are kept once per
 *    account, so bytes it already holds (an unchanged project) are not sent
 *    again, and a save of nothing new sends nothing;
 * 5. `complete`, which makes the version the print's current one.
 */
import type { Created, FileDecl, LibraryClient, LibraryItem, PrintSetup, SaveOrigin, Version, VersionBody } from './api'
import { LibraryError } from './api'
import { gzip, sha256Hex } from './bytes'

export interface SaveOutput {
  gcode: ArrayBuffer;
  name: string;
  setup: { printerModel: string, nozzleMm: number, material: string };
  printSeconds: number | null;
  filamentGrams: number | null;
}

export interface SaveRequest {
  /** null: a new print; else a new version of this one. */
  item: string | null;
  name: string;
  origin: SaveOrigin;
  /** The promise version the person accepted, when this save turns the Library on. */
  consent: string | null;
  project: ArrayBuffer;
  outputs: SaveOutput[];
  thumbnail: ArrayBuffer | null;
  summary: Record<string, string | number | boolean>;
}

export interface SaveProgress {
  sent: number;
  total: number;
}

export interface Saved {
  item: LibraryItem;
  version: Version;
}

/** The longest name the service takes. */
export const MAX_NAME = 200

/** A name the service takes: printable, 1 to 200 characters. */
export function cleanName (name: string, fallback = 'Untitled'): string {
  // eslint-disable-next-line no-control-regex
  const clean = name.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  return [...(clean || fallback)].slice(0, MAX_NAME).join('')
}

/** A file name: the print's name and its extension, within the limit. */
export function fileName (name: string, extension: string): string {
  const stem = [...cleanName(name)].slice(0, MAX_NAME - extension.length - 1).join('')
  return `${stem}.${extension}`
}

const isJpeg = (bytes: Uint8Array) => bytes.length > 2 && bytes[0] === 0xff && bytes[1] === 0xd8

/** The version's body, and the bytes of each file by its hash, for the PUTs the service asks for. */
export async function declareFiles (request: SaveRequest): Promise<{ body: VersionBody, bytes: Map<string, Uint8Array> }> {
  const bytes = new Map<string, Uint8Array>()
  const declare = async (data: Uint8Array, decl: Omit<FileDecl, 'size_bytes' | 'sha256'>): Promise<FileDecl> => {
    const sha256 = await sha256Hex(data)
    bytes.set(sha256, data)
    return { ...decl, size_bytes: data.byteLength, sha256 }
  }
  const files: FileDecl[] = []
  files.push(await declare(new Uint8Array(request.project), { role: 'project', format: '3mf', encoding: 'identity', name: fileName(request.name, '3mf') }))
  for (const output of request.outputs) {
    const setup: PrintSetup = { printer_model: output.setup.printerModel, nozzle_mm: output.setup.nozzleMm, material: output.setup.material }
    const decl: Omit<FileDecl, 'size_bytes' | 'sha256'> = {
      role: 'gcode',
      format: 'gcode',
      encoding: 'gzip',
      name: cleanName(output.name, fileName(request.name, 'gcode')),
      setup
    }
    if (output.printSeconds !== null) decl.print_seconds = Math.round(output.printSeconds)
    if (output.filamentGrams !== null) decl.filament_g = output.filamentGrams
    files.push(await declare(await gzip(new Uint8Array(output.gcode)), decl))
  }
  if (request.thumbnail) {
    const picture = new Uint8Array(request.thumbnail)
    files.push(await declare(picture, { role: 'thumbnail', format: isJpeg(picture) ? 'jpeg' : 'png', encoding: 'identity' }))
  }
  return { body: { origin: request.origin, summary: request.summary, files }, bytes }
}

/** Saves `request`: a new print, or a version of `request.item`. Progress counts only the bytes sent. */
export async function saveToLibrary (client: LibraryClient, request: SaveRequest, onProgress?: (progress: SaveProgress) => void): Promise<Saved> {
  if (request.consent) await client.consent(request.consent)
  const { body, bytes } = await declareFiles(request)
  const created: Created = request.item
    ? await client.createVersion(request.item, body)
    : await client.createPrint({ name: cleanName(request.name), ...body })

  const uploads = created.uploads ?? []
  const total = uploads.reduce((sum, u) => sum + (bytes.get(u.sha256)?.byteLength ?? 0), 0)
  let done = 0
  onProgress?.({ sent: 0, total })
  for (const upload of uploads) {
    const data = bytes.get(upload.sha256)
    if (!data) throw new LibraryError('protocol', 'The Library asked for a file this save did not declare.')
    await client.put(upload.upload, data, sent => onProgress?.({ sent: done + Math.min(sent, data.byteLength), total }))
    done += data.byteLength
    onProgress?.({ sent: done, total })
  }

  const finished = await client.complete(created.item.id, created.version.number)
  return { item: finished?.item ?? created.item, version: finished?.version ?? created.version }
}
