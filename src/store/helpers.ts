import { SocketState, ChartDataSet } from './socket/types'
import { FileChangeItem, FilePaths, AppFile, AppFileWithMeta, KlipperFile, KlipperFileWithMeta, Thumbnail } from './files/types'

/**
 * Return a file thumb if one exists
 * Optionally, pick the largest or smallest image.
 */
export const getThumb = (file: AppFileWithMeta, goLarge = true) => {
  if (
    file.thumbnails &&
    file.thumbnails.length
  ) {
    const thumbs = file.thumbnails
    let thumb: Thumbnail | undefined
    if (thumbs) {
      if (goLarge) {
        thumb = thumbs.reduce((a, c) => (a.size && c.size && (a.size > c.size)) ? a : c)
      } else {
        thumb = thumbs.reduce((a, c) => (a.size && c.size && (a.size < c.size)) ? a : c)
      }
      if (thumb && thumb.data && thumb.data !== null) {
        return { ...thumb, data: 'data:image/gif;base64,' + thumb.data }
      }
    }
  }
  return undefined
}

/**
 * Takes a filename and root and provides;
 * - the filename, with no path.
 * - the path, with no root or filename.
 * - the path, including root.
 */
export const getFilePaths = (filePath: string, root: string): FilePaths => {
  let path = filePath.substr(0, filePath.lastIndexOf('/'))
  path = (path && path.startsWith(root))
    ? path.substring(root.length)
    : path
  return {
    filename: filePath.split('/').pop() || '',
    path,
    rootPath: (path.length === 0) ? root : root + '/' + path
  }
}

/**
 * File Updates come in with the filename representing the filepath,
 * so we need to strip the path to reflect what we store.
 */
export const mergeFileUpdate = (root: string, existing: KlipperFile, updates: KlipperFileWithMeta): KlipperFileWithMeta => {
  const paths = getFilePaths(updates.filename, root)
  updates.filename = paths.filename
  return { ...existing, ...updates }
}

/**
 * Takes file change item and formats to represent an app file.
 */
export const formatAsFile = (root: string, file: FileChangeItem | KlipperFile | KlipperFileWithMeta): AppFile | AppFileWithMeta => {
  // A FileChangeItem
  if ('path' in file) {
    const paths = getFilePaths(file.path, root)
    return {
      type: 'file',
      filename: paths.filename,
      extension: paths.filename.split('.').pop() || '',
      name: paths.filename,
      size: file.size,
      modified: file.modified
    }
  }
  const paths = getFilePaths(file.filename, root)
  return {
    ...file,
    type: 'file',
    extension: paths.filename.split('.').pop() || '',
    name: paths.filename
  }
}

/**
 * Prepare packet data for a chart entry.
 * Every packet can have both a current temperature
 * and a target. Determine if they SHOULD have targets by
 * looking at the config object. If this update is the target,
 * use the existing temp. If this update is the temp, use
 * the existing target.
 * @param key The sensor key to update.
 * @param val The value being passed. We can tell if its a temp or target due to its property name.
 */
export const configureChartEntry = (key: string, val: {[key: string]: number }, state: SocketState) => {
  const config = state.printer[key]
  let label = key
  if (key.includes(' ')) label = key.split(' ')[1]

  const now = new Date() // Common date for this data.
  const r: {temperature?: ChartDataSet; target?: ChartDataSet} = {}

  if ('temperature' in val) {
    r.temperature = {
      label,
      data: [{ x: now, y: val.temperature }]
    }
  } else {
    r.temperature = {
      label,
      data: [{ x: now, y: config.temperature }]
    }
  }

  if ('target' in val) {
    r.target = {
      label: `${label}Target`,
      data: [{ x: now, y: val.target }]
    }
  } else {
    if ('target' in config) {
      r.target = {
        label: `${label}Target`,
        data: [{ x: now, y: config.target }]
      }
    }
  }

  return r
}
