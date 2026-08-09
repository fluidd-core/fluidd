import type { BuildLayerPathsOptions, LayerPaths, MoveStore, Point, Tool } from '@/store/gcodePreview/types'
import { MoveFlags } from '@/store/gcodePreview/types'
import decimalRound from './decimal-round'

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
    includeTools = false
  } = options ?? {}

  const { x, y, tool, flags: moveFlags, length } = moves

  const startIndex = Math.min(startMove, length - 1)

  let toolheadX = startIndex >= 0 ? x[startIndex] : 0
  let toolheadY = startIndex >= 0 ? y[startIndex] : 0

  const movesPath: string[] = includeMoves
    ? [`M${formatCoordinate(toolheadX)},${formatCoordinate(toolheadY)}`]
    : []
  const extrusionPaths = new Map<number, string[]>()
  const retractions: Point[] = []
  const unretractions: Point[] = []

  // tool currently laying down extrusions, or -1 while traveling
  let activeTool = -1
  let currentTool = 0
  let activePath: string[] = []

  for (let index = Math.max(0, startMove); index <= endMove && index < length; index++) {
    if (includeTools) {
      currentTool = tool[index]
    }

    const flags = moveFlags[index]

    if ((flags & MoveFlags.Extruding) !== 0) {
      if (includeRetractions && activeTool < 0) {
        unretractions.push({
          x: formatCoordinate(toolheadX),
          y: formatCoordinate(toolheadY)
        })
      }

      if (includeExtrusions) {
        if (activeTool !== currentTool) {
          activePath = extrusionPaths.get(currentTool) ?? []

          extrusionPaths.set(currentTool, activePath)
          activePath.push(`M${formatCoordinate(toolheadX)},${formatCoordinate(toolheadY)}`)
        }

        activePath.push(moveToSVGPath(moves, index, toolheadX, toolheadY))
      }

      activeTool = currentTool
    } else {
      if (includeMoves) {
        if (activeTool >= 0) {
          movesPath.push(`M${formatCoordinate(toolheadX)},${formatCoordinate(toolheadY)}`)
        }

        movesPath.push(moveToSVGPath(moves, index, toolheadX, toolheadY))
      }

      activeTool = -1

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

  const extrusions = {} as Record<Tool, string>

  for (const [toolIndex, path] of extrusionPaths) {
    extrusions[`T${toolIndex}`] = path.join('')
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
