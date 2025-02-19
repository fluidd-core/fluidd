import { Globals } from '@/globals'
import type { FilePaths } from '@/store/files/types'

const getFilePaths = (pathFilename: string, root = ''): FilePaths => {
  const pathParts = pathFilename.split('/')
  const filtered = Globals.FILTERED_FOLDER_NAMES.some(x => pathParts.includes(x))
  const filename = pathParts.pop() ?? ''
  const path = pathParts.join('/')

  const rootPath = root && path ? `${root}/${path}` : root || path
  const rootPathFilename = rootPath ? `${rootPath}/${filename}` : filename

  const extensionIndex = filename.lastIndexOf('.')
  const extension = extensionIndex >= 0 ? filename.substring(extensionIndex) : ''

  return {
    root,
    rootPath,
    rootPathFilename,
    path,
    pathFilename,
    filename,
    extension,
    filtered
  }
}

export default getFilePaths
