import getFilePaths from './get-file-paths'
import { AppFile } from '@/store/files/types'

/**
 * File Updates come in with the filename representing the filepath,
 * so we need to strip the path to reflect what we store.
 */
const mergeFileUpdate = <T extends AppFile>(root: string, existing: T, updates: T): T => {
  const paths = getFilePaths(updates.filename, root)
  updates.filename = paths.filename
  return { ...existing, ...updates }
}

export default mergeFileUpdate
