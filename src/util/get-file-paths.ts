import {
  FilePaths
} from '@/store/files/types'

/**
 * Takes a filename and root and provides;
 * - the filename, with no path.
 * - the path, with no root or filename.
 * - the path, including root.
 */
export default (filePath: string, root: string): FilePaths => {
  let path = filePath.substr(0, filePath.lastIndexOf('/'))
  path = (path && path.startsWith(root))
    ? path.substring(root.length + 1)
    : path
  return {
    filename: filePath.split('/').pop() || '',
    path,
    rootPath: (path.length === 0) ? root : root + '/' + path
  }
}
