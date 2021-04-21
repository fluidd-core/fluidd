import { ChartData } from './charts/types'
import {
  AppFile,
  AppFileWithMeta,
  FileChangeItem,
  FilePaths,
  KlipperFile,
  KlipperFileWithMeta,
  Thumbnail
} from './files/types'
import { SocketActions } from '@/socketActions'
import store from '@/store'
import { KlipperMesh, ProcessedMesh } from './mesh/types'
import { ArcMove, Move, Point, Rotation } from '@/store/gcodePreview/types'
import { LayoutConfig, Layouts } from './layout/types'

export const isOfType = <T> (
  varToBeChecked: any,
  propertyToCheckFor: keyof T
): varToBeChecked is T => (varToBeChecked as T)[propertyToCheckFor] !== undefined

/**
 * Return a file thumb if one exists
 * Optionally, pick the largest or smallest image.
 */
export const getThumb = (thumbnails: Thumbnail[], path: string, goLarge = true) => {
  const apiUrl = store.state.config?.apiUrl
  if (thumbnails.length) {
    let thumb: Thumbnail | undefined
    if (thumbnails) {
      if (goLarge) {
        thumb = thumbnails.reduce((a, c) => (a.size && c.size && (a.size > c.size)) ? a : c)
      } else {
        thumb = thumbnails.reduce((a, c) => (a.size && c.size && (a.size < c.size)) ? a : c)
      }
      if (thumb) {
        if (thumb.relative_path && thumb.relative_path.length > 0) {
          return {
            ...thumb,
            absolute_path: (path === '')
              ? encodeURI(`${apiUrl}/server/files/gcodes/${thumb.relative_path}`)
              : encodeURI(`${apiUrl}/server/files/gcodes/${path}/${thumb.relative_path}`)
          }
        }
        if (thumb.data) {
          return {
            ...thumb,
            data: 'data:image/gif;base64,' + thumb.data
          }
        }
      }
    }
  }
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

/**
 * Prepare packet data for a chart entry.
 * Every packet should contain an entry for all known sensors we want to track.
 */
export const handleAddChartEntry = (retention: number, keys: string[]) => {
  const configureChartEntry = (date: Date) => {
    const r: ChartData = {
      date
    }

    keys.forEach((key) => {
      let label = key
      if (key.includes(' ')) label = key.split(' ')[1]
      const temp = store.state.printer?.printer[key].temperature
      const target = store.state.printer?.printer[key].target
      const power = store.state.printer?.printer[key].power
      const speed = store.state.printer?.printer[key].speed
      r[label] = temp
      if (target !== undefined) r[`${label}Target`] = target
      if (power !== undefined) r[`${label}Power`] = power
      if (speed !== undefined) r[`${label}Speed`] = speed
    })

    return r
  }

  if (store.state.charts && store.state.charts.ready) {
    // Ensure we only add an entry every 1000ms.
    const diff = 1000 // time to wait before adding another entry.
    const date1 = new Date()
    const date2 = (store.state.charts.chart.length > 0)
      ? new Date(store.state.charts.chart[store.state.charts.chart.length - 1].date)
      : null
    if (!date2 || date1.getTime() - date2.getTime() > diff) {
      const data = configureChartEntry(date1)
      store.commit('charts/setChartEntry', {
        data,
        retention
      })
    }
  }
}

export const handlePrintStateChange = (payload: any) => {
  // For every notify - if print_stats.state changes from standby -> printing,
  // then record an entry in our print history.
  // If the state changes from printing -> complete, then record the finish time.
  if (
    'print_stats' in payload &&
    'state' in payload.print_stats
  ) {
    if (
      store.state.printer?.printer.print_stats.state === 'standby' &&
      payload.print_stats.state === 'printing'
    ) {
      // This is a new print starting...
      store.dispatch('printer/onPrintStart', payload)
    } else if (
      store.state.printer?.printer.print_stats.state === 'printing' &&
      payload.print_stats.state === 'complete'
    ) {
      // This is a completed print...
      store.dispatch('printer/onPrintEnd', payload)
    } else if (
      store.state.printer?.printer.print_stats.state === 'printing' &&
      payload.print_stats.state === 'standby'
    ) {
      // This is a cancelled print...
      store.dispatch('printer/onPrintEnd', payload)
    }
  }
}

export const handleCurrentFileChange = (payload: any) => {
  if (
    'print_stats' in payload &&
    'filename' in payload.print_stats &&
    payload.print_stats.filename !== store.state.printer?.printer.print_stats.filename
  ) {
    store.commit('printer/setResetCurrentFile')
    if (
      payload.print_stats.filename !== '' &&
      payload.print_stats.filename !== null
    ) {
      // This refreshes the metadata for the current file, which also
      // ensures we update the current_file with the latest data via
      // the files/onFileUpdate action.
      SocketActions.serverFilesMetaData(payload.print_stats.filename)
    }
  }
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

// export const flatMesh = (mesh: KlipperMesh) => {
//   const bed_mesh = mesh
// }

export const transformMesh = (mesh: KlipperMesh, meshMatrix: string, makeFlat = false): ProcessedMesh => {
  const bed_mesh = mesh
  const matrix = bed_mesh[meshMatrix] as number[][]
  const coordinates = []
  let min = 0
  let mid = 0
  let max = 0
  let variance = 0

  if (
    matrix &&
    matrix.length >= 3 &&
    matrix[0] &&
    matrix[0].length >= 3 &&
    bed_mesh.mesh_min &&
    bed_mesh.mesh_max
  ) {
    const x_distance = (bed_mesh.mesh_max[0] - bed_mesh.mesh_min[0]) / (matrix[0].length - 1)
    const y_distance = (bed_mesh.mesh_max[1] - bed_mesh.mesh_min[1]) / (matrix.length - 1)
    let x_idx = 0
    let y_idx = 0

    min = Math.min(...matrix.map(row => Math.min(...row)))
    max = Math.max(...matrix.map(row => Math.max(...row)))
    if (min <= 0 && max >= 0) {
      mid = 0
    } else {
      mid = (max + min) / 2
    }
    variance = Math.abs(min - max)

    for (const x_axis of matrix) {
      x_idx = 0
      const y_coord = bed_mesh.mesh_min[1] + (y_idx * y_distance)
      for (const z_coord of x_axis) {
        const x_coord = bed_mesh.mesh_min[0] + (x_idx * x_distance)
        x_idx++
        coordinates.push(
          {
            name: `x${x_idx}_y${y_idx}`,
            value: [
              x_coord,
              y_coord,
              (makeFlat) ? mid : z_coord
            ]
          }
        )
      }
      y_idx++
    }
  }

  return {
    coordinates,
    min,
    mid,
    max,
    variance
  }
}

export const parseGcode = (line: string) => {
  const [, command, args = ''] = line
    .trim()
    .split(';', 2)[0]
    .split(/^([a-z][0-9]+)\s+/i)

  if (!/^(G|M)\d+$/.test(command)) {
    return null
  }

  const argMap: any = {}

  for (const [, key, value] of args.matchAll(/([a-z])[ \t]*(-?\d+(?:\.\d+)?)/ig)) {
    argMap[key.toLowerCase()] = Number(value)
  }

  return {
    command: command.toUpperCase(),
    args: argMap
  }
}

export const binarySearch = (arr: any[], comp: Function, approx = false): number => {
  if (arr.length <= 1) {
    return 0
  }

  let index = Math.floor(arr.length / 2)
  let topBound = arr.length - 1
  let bottomBound = 0

  while (bottomBound <= topBound) {
    const result = comp(arr[index], index, arr)

    if (result > 0) {
      bottomBound = index + 1
    } else if (result < 0) {
      topBound = index - 1
    } else {
      return index
    }

    index = Math.round((bottomBound + topBound) / 2)
  }

  return approx ? index : -1
}

function distance (a: Point, b: Point): number {
  const diffX = Math.abs(a.x - b.x)
  const diffY = Math.abs(a.y - b.y)

  return Math.sqrt(diffX ** 2 + diffY ** 2)
}

function angleBetween (a: Point, b: Point) {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI)
}

function arcIJMoveToSVGPath (toolhead: Point, move: ArcMove): string {
  const destination = {
    x: move.x ?? toolhead.x,
    y: move.y ?? toolhead.y
  }

  const center = {
    x: toolhead.x + (move.i ?? 0),
    y: toolhead.y + (move.j ?? 0)
  }

  const radius = distance(toolhead, center)
  let angle = angleBetween(center, toolhead) - angleBetween(center, destination)

  if (angle > 180) {
    angle -= 360
  } else if (angle < -180) {
    angle += 360
  }

  switch (move.direction) {
    case Rotation.Clockwise:
      return [
        'A', radius, radius, 0, Number(angle < 0), 0, destination.x, destination.y
      ].join(' ')
    case Rotation.CounterClockwise:
      return [
        'M', destination.x, destination.y,
        'A', radius, radius, 0, Number(angle > 0), 0, toolhead.x, toolhead.y,
        'M', destination.x, destination.y
      ].join(' ')
    default:
      throw new TypeError('move has no direction')
  }
}

/**
 * Taken from https://stackoverflow.com/a/42803692
 */
function findIntersections (center1: Point, center2: Point, radius: number) {
  const d = Math.sqrt((center2.x - center1.x) ** 2 + (center2.y - center1.y) ** 2)
  const a = (d ** 2) / (2 * d)
  const h = Math.sqrt(radius ** 2 - a ** 2)
  const x2 = center1.x + a * (center2.x - center1.x) / d
  const y2 = center1.y + a * (center2.y - center1.y) / d

  const x3 = x2 + h * (center2.y - center1.y) / d
  const y3 = y2 - h * (center2.x - center1.x) / d

  const x4 = x2 - h * (center2.y - center1.y) / d
  const y4 = y2 + h * (center2.x - center1.x) / d

  return [{
    x: x3,
    y: y3
  }, {
    x: x4,
    y: y4
  }]
}

function arcRMoveToSVGPath (toolhead: Point, move: ArcMove): string {
  const intersections = findIntersections(
    toolhead,
    {
      x: move.x ?? toolhead.x,
      y: move.y ?? toolhead.y
    },
    move.r ?? NaN
  )

  throw new Error('todo')
}

export function arcMoveToSvgPath (toolhead: Point, move: ArcMove): string {
  if (move.i !== undefined && move.j !== undefined) {
    return arcIJMoveToSVGPath(toolhead, move)
  }

  if (move.r !== undefined) {
    return arcRMoveToSVGPath(toolhead, move)
  }

  throw new TypeError('Move is not a valid arc')
}

// Assumes the path is pr
export function moveToSVGPath (toolhead: Point, move: Move) {
  // todo figure out if I can just typecheck this
  if (Object.hasOwnProperty.call(move, 'direction')) {
    return arcMoveToSvgPath(toolhead, move as ArcMove)
  } else {
    return `L ${move.x ?? toolhead.x},${move.y ?? toolhead.y}`
  }
}

// export const transformMesh = (mesh: KlipperMesh, meshMatrix: string, makeFlat = false): ProcessedMesh => {
// export const getKnownComponents = () => {
//   return []
// }
export const getAllLayouts = (layouts: Layouts) => {
  let knownComponents: LayoutConfig[] = []
  for (const _layout in layouts) {
    const layout = layouts[_layout]
    for (const _container in layout) {
      const container = layouts[_layout][_container]
        .map(config => ({ ...config, container: _container, layout: _layout }))
      knownComponents = [
        ...knownComponents,
        ...container
      ]
    }
  }
  return knownComponents
}
