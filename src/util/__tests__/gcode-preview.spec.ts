import { binarySearch } from '../gcode-preview'

const searchIn = (values: readonly number[], target: number): number => {
  return binarySearch(values.length, index => target - values[index])
}

const lastIndexAtOrBelow = (values: readonly number[], target: number): number => {
  let result = -1

  for (let index = 0; index < values.length; index++) {
    if (values[index] <= target) {
      result = index
    }
  }

  return result
}

describe('binarySearch', () => {
  it('returns -1 for an empty range', () => {
    expect(searchIn([], 0)).toBe(-1)
    expect(searchIn([], 100)).toBe(-1)
  })

  it.each([
    [4, -1],
    [5, 0],
    [6, 0],
  ])('handles a single entry with target %i', (target, expected) => {
    expect(searchIn([5], target)).toBe(expected)
  })

  it('returns -1 when the target sorts before the first entry', () => {
    expect(searchIn([5, 8, 11], 4)).toBe(-1)
  })

  it.each([
    [5, 0],
    [8, 1],
    [11, 2],
    [14, 3],
  ])('finds the exact match for %i', (target, expected) => {
    expect(searchIn([5, 8, 11, 14], target)).toBe(expected)
  })

  it.each([
    [6, 0],
    [7, 0],
    [9, 1],
    [13, 2],
  ])('floors %i to the preceding entry', (target, expected) => {
    expect(searchIn([5, 8, 11, 14], target)).toBe(expected)
  })

  it('returns the last index when the target is past the end', () => {
    expect(searchIn([5, 8, 11, 14], 15)).toBe(3)
    expect(searchIn([5, 8, 11, 14], 1000)).toBe(3)
  })

  it.each([
    [1],
    [2],
    [3],
    [4],
    [5],
    [16],
    [17],
    [64],
    [65],
  ])('matches the reference implementation for %i entries', (length) => {
    const values = Array.from({ length }, (_, index) => index * 3 + 5)

    for (let target = 0; target <= length * 3 + 8; target++) {
      expect(searchIn(values, target)).toBe(lastIndexAtOrBelow(values, target))
    }
  })
})
