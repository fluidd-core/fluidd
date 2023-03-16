// https://github.com/coreutils/gnulib/blob/master/lib/filevercmp.h
// https://github.com/coreutils/gnulib/blob/master/lib/filevercmp.c

const extensionRegExp = /((?:\.[A-Za-z~][A-Za-z0-9~]*)*)$/

const charCode_0 = 0x30
const charCode_9 = 0x39
const charCode_A = 0x41
const charCode_Z = 0x5A
const charCode_a = 0x61
const charCode_z = 0x7A
const charCode_tilde = 0x7e

const isDigit = (c: number) => c >= charCode_0 && c <= charCode_9
const isAlpha = (c: number) => (c >= charCode_A && c <= charCode_Z) || (c >= charCode_a && c <= charCode_z)

const stringToAsciiByteArray = (value: string) => {
  const bytes = []
  for (let index = 0; index < value.length; index++) {
    const charCode = value.charCodeAt(index)
    bytes.push(charCode & 0xFF)
  }
  return bytes
}

const order = (c: number): number => {
  if (!c) {
    return -1
  } else if (isDigit(c)) {
    return 0
  } else if (isAlpha(c)) {
    return c
  } else if (c === charCode_tilde) {
    return -2
  } else {
    return c + 256
  }
}

const versionStringCompareHelper = (stringA: string, stringB: string) => {
  const bufA = stringToAsciiByteArray(stringA)
  const bufB = stringToAsciiByteArray(stringB)
  const lenA = bufA.length
  const lenB = bufB.length

  if (lenA === 0 || lenB === 0) {
    return lenA - lenB
  }

  let posA = 0
  let posB = 0

  while (posA < lenA && posB < lenB) {
    let first_diff = 0

    while ((posA < lenA && !isDigit(bufA[posA])) || (posB < lenB && !isDigit(bufB[posB]))) {
      const a = order(bufA[posA])
      const b = order(bufB[posB])
      if (a !== b) {
        return a - b
      }
      posA++
      posB++
    }

    while (posA < lenA && bufA[posA] === charCode_0) {
      posA++
    }

    while (posB < lenB && bufB[posB] === charCode_0) {
      posB++
    }

    while (posA < lenA && posB < lenB && isDigit(bufA[posA]) && isDigit(bufB[posB])) {
      if (!first_diff) {
        first_diff = bufA[posA] - bufB[posB]
      }
      posA++
      posB++
    }

    if (posA < lenA && isDigit(bufA[posA])) {
      return 1
    }

    if (posB < lenB && isDigit(bufB[posB])) {
      return -1
    }

    if (first_diff) {
      return first_diff
    }
  }

  return 0
}

const versionStringCompare = (stringA: string, stringB: string) => {
  if (stringA === stringB) {
    return 0
  }

  const nameA = stringA.replace(extensionRegExp, '')
  const nameB = stringB.replace(extensionRegExp, '')

  return nameA === nameB
    ? versionStringCompareHelper(stringA, stringB)
    : versionStringCompareHelper(nameA, nameB)
}

export default versionStringCompare
