import type { BuildLayerPathsOptions, LayerPaths, MinMax, MoveStore, Point } from '@/store/gcodePreview/types'
import { MoveFlags } from '@/store/gcodePreview/types'
import decimalRound from './decimal-round'

// PrusaSlicer's DEFAULT_RANGES_COLORS
export const rangeColors = Object.freeze([
  '#0B2C7A', '#135985', '#1C8891', '#04D60F', '#AAF200', '#FCF903',
  '#F5CE0A', '#E38820', '#D16830', '#C2523C', '#942616'
])

const lastRangeBucket = rangeColors.length - 1

// nearest of the evenly spaced rangeColors stops from min to max, like PrusaSlicer's range legend
export const rangeBucket = (value: number, range: Readonly<MinMax> | null | undefined): number => {
  if (!range || range.max <= range.min) {
    return 0
  }

  const bucket = Math.round(((value - range.min) / (range.max - range.min)) * lastRangeBucket)

  return Math.min(lastRangeBucket, Math.max(0, bucket))
}

const groupPrefixes = {
  tool: 'T',
  role: 'R',
  speed: 'S',
  fan: 'F'
} as const

const TRAVELING = -1

export const binarySearch = (length: number, comp: (index: number) => number): number => {
  let topBound = length - 1
  let bottomBound = 0

  while (bottomBound <= topBound) {
    const index = (bottomBound + topBound) >> 1
    const result = comp(index)

    if (result > 0) {
      bottomBound = index + 1
    } else if (result < 0) {
      topBound = index - 1
    } else {
      return index
    }
  }

  // -1 when the target sorts before the first entry
  return topBound
}

// Float32 round-trips to values like 123.44999694824219; rounding to microns
// keeps the emitted path data short with no visible difference at preview scale
const formatCoordinate = (value: number): number => {
  return decimalRound(value, 3)
}

const RADIANS_TO_DEGREES = 180 / Math.PI

const angleBetween = (fromX: number, fromY: number, toX: number, toY: number): number => {
  return Math.atan2(toY - fromY, toX - fromX) * RADIANS_TO_DEGREES
}

const arcToSVGPath = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  i: number,
  j: number,
  clockwise: boolean
): string => {
  const centerX = fromX + i
  const centerY = fromY + j

  const radius = formatCoordinate(Math.hypot(i, j))

  let angle = angleBetween(centerX, centerY, fromX, fromY) - angleBetween(centerX, centerY, toX, toY)

  if (angle > 180) {
    angle -= 360
  } else if (angle < -180) {
    angle += 360
  }

  const x = formatCoordinate(toX)
  const y = formatCoordinate(toY)

  if (clockwise) {
    return `A${radius},${radius},0,${+(angle < 0)},0,${x},${y}`
  }

  return `M${x},${y}` +
    `A${radius},${radius},0,${+(angle > 0)},0,${formatCoordinate(fromX)},${formatCoordinate(fromY)}` +
    `M${x},${y}`
}

const moveToSVGPath = (moves: MoveStore, index: number, fromX: number, fromY: number): string => {
  const toX = moves.x[index]
  const toY = moves.y[index]
  const flags = moves.flags[index]

  if ((flags & MoveFlags.Arc) !== 0) {
    return arcToSVGPath(fromX, fromY, toX, toY, moves.i[index], moves.j[index], (flags & MoveFlags.Clockwise) !== 0)
  }

  return `L${formatCoordinate(toX)},${formatCoordinate(toY)}`
}

export const buildLayerPaths = (
  moves: MoveStore,
  startMove: number,
  endMove: number,
  options?: BuildLayerPathsOptions
): Readonly<LayerPaths> => {
  const {
    includeExtrusions = true,
    includeMoves = false,
    includeRetractions = false,
    includeTools = false,
    colorBy = 'tool',
    speedRange,
    fanRange
  } = options ?? {}

  const { x, y, tool, role, speed, fan, flags: moveFlags, length } = moves

  const groupPrefix = groupPrefixes[colorBy]

  const startIndex = Math.min(startMove, length - 1)

  let toolheadX = startIndex >= 0 ? x[startIndex] : 0
  let toolheadY = startIndex >= 0 ? y[startIndex] : 0

  const movesPath: string[] = includeMoves
    ? [`M${formatCoordinate(toolheadX)},${formatCoordinate(toolheadY)}`]
    : []
  const extrusionPaths = new Map<number, string[]>()
  const retractions: Point[] = []
  const unretractions: Point[] = []

  let activeGroup = TRAVELING
  let currentTool = 0
  let activePath: string[] = []

  for (let index = Math.max(0, startMove); index <= endMove && index < length; index++) {
    if (includeTools) {
      currentTool = tool[index]
    }

    const flags = moveFlags[index]

    if ((flags & MoveFlags.Extruding) !== 0) {
      if (includeRetractions && activeGroup === TRAVELING) {
        unretractions.push({
          x: formatCoordinate(toolheadX),
          y: formatCoordinate(toolheadY)
        })
      }

      let group: number

      switch (colorBy) {
        case 'role':
          group = role[index]
          break
        case 'speed':
          group = rangeBucket(speed[index], speedRange)
          break
        case 'fan':
          group = rangeBucket(fan[index], fanRange)
          break
        default:
          group = currentTool
      }

      if (includeExtrusions) {
        if (activeGroup !== group) {
          activePath = extrusionPaths.get(group) ?? []

          extrusionPaths.set(group, activePath)
          activePath.push(`M${formatCoordinate(toolheadX)},${formatCoordinate(toolheadY)}`)
        }

        activePath.push(moveToSVGPath(moves, index, toolheadX, toolheadY))
      }

      activeGroup = group
    } else {
      if (includeMoves) {
        if (activeGroup !== TRAVELING) {
          movesPath.push(`M${formatCoordinate(toolheadX)},${formatCoordinate(toolheadY)}`)
        }

        movesPath.push(moveToSVGPath(moves, index, toolheadX, toolheadY))
      }

      activeGroup = TRAVELING

      if (includeRetractions && (flags & MoveFlags.Retracting) !== 0) {
        retractions.push({
          x: formatCoordinate(toolheadX),
          y: formatCoordinate(toolheadY)
        })
      }
    }

    toolheadX = x[index]
    toolheadY = y[index]
  }

  const extrusions: Record<string, string> = {}

  for (const [group, path] of extrusionPaths) {
    extrusions[`${groupPrefix}${group}`] = path.join('')
  }

  return Object.freeze({
    extrusions,
    moves: movesPath.join(''),
    retractions,
    unretractions,
    toolhead: {
      x: formatCoordinate(toolheadX),
      y: formatCoordinate(toolheadY)
    },
    tool: `T${currentTool}`
  })
}
