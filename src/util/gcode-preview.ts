import type { ArcMove, Move, Point } from '@/store/gcodePreview/types'

type BinarySearchComparer<T> = (item: T, index: number, array: Array<T> | ReadonlyArray<T>) => number

export const binarySearch = <T>(arr: Array<T> | ReadonlyArray<T>, comp: BinarySearchComparer<T>, approx = false): number => {
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

  switch (move.d) {
    case 'clockwise':
      return `A${radius},${radius},0,${+(angle < 0)},0,${destination.x},${destination.y}`

    case 'counter-clockwise':
      return `M${destination.x},${destination.y}` +
        `A${radius},${radius},0,${+(angle > 0)},0,${toolhead.x},${toolhead.y}` +
        `M${destination.x},${destination.y}`

    default:
      throw new TypeError('move has no direction')
  }
}

function arcRMoveToSVGPath (toolhead: Point, move: ArcMove): string {
  const destination = {
    x: move.x ?? toolhead.x,
    y: move.y ?? toolhead.y
  }

  const delta = {
    x: destination.x - toolhead.x,
    y: destination.y - toolhead.y
  }

  const r = move.r ?? 0
  const chord = Math.hypot(delta.x, delta.y)

  if (chord === 0 || chord > 2 * Math.abs(r)) {
    return `L${destination.x},${destination.y}`
  }

  const h = Math.sqrt(r * r - (chord * chord) / 4)
  const sign = ((r < 0) !== (move.d === 'clockwise')) ? -1 : 1
  const i = delta.x / 2 + (sign * h * -delta.y) / chord
  const j = delta.y / 2 + (sign * h * delta.x) / chord

  return arcIJMoveToSVGPath(toolhead, { ...move, i, j })
}

export function arcMoveToSvgPath (toolhead: Point, move: ArcMove): string {
  if (move.plane === 'xz' || move.plane === 'yz') {
    // G18/G19: arc lies in a vertical plane; the XY projection is not a clean
    // SVG arc, so render as a straight line to the destination XY.
    return `L${move.x ?? toolhead.x},${move.y ?? toolhead.y}`
  }

  if (move.i !== undefined || move.j !== undefined) {
    return arcIJMoveToSVGPath(toolhead, move)
  }

  if (move.r !== undefined) {
    return arcRMoveToSVGPath(toolhead, move)
  }

  throw new TypeError('Move is not a valid arc')
}

export function moveToSVGPath (toolhead: Point, move: Move) {
  return (
    'd' in move
      ? arcMoveToSvgPath(toolhead, move)
      : `L${move.x ?? toolhead.x},${move.y ?? toolhead.y}`
  )
}
