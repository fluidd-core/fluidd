import getFilePaths from './get-file-paths'
import {
  AppFile,
  AppFileWithMeta
} from '@/store/files/types'

/**
 * File Updates come in with the filename representing the filepath,
 * so we need to strip the path to reflect what we store.
 */
export default (root: string, existing: AppFile | AppFileWithMeta | {}, updates: AppFile | AppFileWithMeta): AppFileWithMeta | AppFile => {
  const paths = getFilePaths(updates.filename, root)
  updates.filename = paths.filename
  return { ...existing, ...updates }
}
