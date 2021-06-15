import getFilePaths from './get-file-paths'
import { FileChangeItem, KlipperFile, KlipperFileWithMeta, AppFile, AppFileWithMeta } from '@/store/files/types'

/**
 * Takes file change item and formats to represent an app file.
 */
export default (root: string, file: FileChangeItem | KlipperFile | KlipperFileWithMeta): AppFile | AppFileWithMeta => {
  // A FileChangeItem
  if ('path' in file) {
    const paths = getFilePaths(file.path, root)
    return {
      type: 'file',
      filename: paths.filename,
      extension: paths.filename.split('.').pop() || '',
      name: paths.filename,
      path: paths.path,
      size: file.size,
      modified: file.modified
    }
  }
  const paths = getFilePaths(file.filename, root)
  return {
    ...file,
    type: 'file',
    extension: paths.filename.split('.').pop() || '',
    name: paths.filename,
    path: paths.path
  }
}
