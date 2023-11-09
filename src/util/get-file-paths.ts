import { Globals } from '@/globals'
import type { FilePaths } from '@/store/files/types'

/**
 * Takes a filename and root and provides;
 * - the filename, with no path.
 * - the path, with no root or filename.
 * - the path, including root.
 */
const getFilePaths = (filePath: string, root: string): FilePaths => {
  const pathParts = filePath.split('/')
  const filtered = Globals.FILTERED_FOLDER_NAMES.some(x => pathParts.includes(x))
  const filename = pathParts.pop() ?? ''
  const path = pathParts.join('/')

  return {
    filename,
    path,
    rootPath: path ? `${root}/${path}` : root,
    filtered
  }
}

export default getFilePaths
