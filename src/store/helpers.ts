import { SocketState, ChartData } from './socket/types'
import { FileChangeItem, FilePaths, AppFile, AppFileWithMeta, KlipperFile, KlipperFileWithMeta, Thumbnail } from './files/types'

/* eslint-disable @typescript-eslint/no-explicit-any */
export const isOfType = <T>(
  varToBeChecked: any,
  propertyToCheckFor: keyof T
): varToBeChecked is T => (varToBeChecked as T)[propertyToCheckFor] !== undefined
/* eslint-enable @typescript-eslint/no-explicit-any */

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
export const mergeFileUpdate = (root: string, existing: AppFile | AppFileWithMeta | {}, updates: AppFile | AppFileWithMeta): AppFileWithMeta | AppFile => {
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
 * Every packet should contain an entry for all known sensors we want to track.
 */
export const configureChartEntry = (state: SocketState, keys: string[]) => {
  const date = new Date() // Common date for this data.
  const r: ChartData = {
    date
  }

  keys.forEach((key) => {
    let label = key
    if (key.includes(' ')) label = key.split(' ')[1]
    const temp = state.printer[key].temperature
    const target = state.printer[key].target
    const power = state.printer[key].power
    const speed = state.printer[key].speed
    r[label] = temp
    if (target !== undefined) r[`${label}Target`] = target
    if (power !== undefined) r[`${label}Power`] = power
    if (speed !== undefined) r[`${label}Speed`] = speed
  })

  return r
}

/**
 * Map object prefixes and names to their generic types.
 * I.e., temperature_fans and heater_fans are both fans.
 */
export const getKlipperType = (name: string) => {
  const fans = [
    'temperature_fan',
    'controller_fan',
    'heater_fan',
    'fan_generic',
    'fan'
  ]

  const sensors = [
    'temperature_sensor',
    'temperature_probe'
  ]

  const heaters = [
    'heater_generic',
    'extruder'
  ]

  const beds = [
    'heater_bed'
  ]

  if (fans.some(s => name.startsWith(s))) return 'fan'
  if (sensors.some(s => name.startsWith(s))) return 'sensor'
  if (heaters.some(s => name.startsWith(s))) return 'heater'
  if (beds.some(s => name.startsWith(s))) return 'bed'
  return ''
}

/**
 * Given a sensor, determine if it has target and power data.
 */
// export const
