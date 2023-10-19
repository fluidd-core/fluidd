import getFilePaths from './get-file-paths'
import type { KlipperFile } from '@/store/files/types'

/**
 * File Updates come in with the filename representing the filepath,
 * so we need to strip the path to reflect what we store.
 */
const mergeFileUpdate = <T extends KlipperFile>(root: string, existing: T, updates: Partial<T> & { filename: string; }): T => {
  const paths = getFilePaths(updates.filename, root)
  updates.filename = paths.filename
  return { ...existing, ...updates }
}

export default mergeFileUpdate
