import { ArcMove, Move, Point } from '@/store/gcodePreview/types'

type BinarySearchComparer<T> = (item: T, index: number, array: T[]) => number

export const binarySearch = <T>(arr: T[], comp: BinarySearchComparer<T>, approx = false): number => {
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

    index = Math.floor((bottomBound + topBound) / 2)
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
    case 'clockwise':
      return 'A' + [
        radius, radius, 0, +(angle < 0), 0, destination.x, destination.y
      ].join(',')
    case 'counter-clockwise':
      return '' +
        'M' + [destination.x, destination.y].join(',') +
        'A' + [radius, radius, 0, +(angle > 0), 0, toolhead.x, toolhead.y].join(',') +
        'M' + [destination.x, destination.y].join(',')
    default:
      throw new TypeError('move has no direction')
  }
}

/**
 * Taken from https://stackoverflow.com/a/42803692
 */
// function findIntersections (center1: Point, center2: Point, radius: number) {
//   const d = Math.sqrt((center2.x - center1.x) ** 2 + (center2.y - center1.y) ** 2)
//   const a = (d ** 2) / (2 * d)
//   const h = Math.sqrt(radius ** 2 - a ** 2)
//   const x2 = center1.x + a * (center2.x - center1.x) / d
//   const y2 = center1.y + a * (center2.y - center1.y) / d

//   const x3 = x2 + h * (center2.y - center1.y) / d
//   const y3 = y2 - h * (center2.x - center1.x) / d

//   const x4 = x2 - h * (center2.y - center1.y) / d
//   const y4 = y2 + h * (center2.x - center1.x) / d

//   return [{
//     x: x3,
//     y: y3
//   }, {
//     x: x4,
//     y: y4
//   }]
// }

// function arcRMoveToSVGPath (toolhead: Point, move: ArcMove): string {
//   const intersections = findIntersections(
//     toolhead,
//     {
//       x: move.x ?? toolhead.x,
//       y: move.y ?? toolhead.y
//     },
//     move.r ?? NaN
//   )

//   throw new Error('Arcs with the R parameter are currently not supported. ' +
//     'Please make a Github issue with some sample gcode so we can resolve this')
// }

export function arcMoveToSvgPath (toolhead: Point, move: ArcMove): string {
  if (move.i !== undefined && move.j !== undefined) {
    return arcIJMoveToSVGPath(toolhead, move)
  }

  if (move.r !== undefined) {
    // return arcRMoveToSVGPath(toolhead, move)
    throw new Error('Arcs with the R parameter are currently not supported. ' +
    'Please make a Github issue with some sample gcode so we can resolve this')
  }

  throw new TypeError('Move is not a valid arc')
}

// Assumes the path is pr
export function moveToSVGPath (toolhead: Point, move: Move) {
  if (Object.hasOwnProperty.call(move, 'direction')) {
    return arcMoveToSvgPath(toolhead, move as ArcMove)
  } else {
    return `L${move.x ?? toolhead.x},${move.y ?? toolhead.y}`
  }
}
