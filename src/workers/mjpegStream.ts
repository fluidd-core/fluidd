const chunkSize = 8192 // 8KB chunks for good performance

const headerEndPattern = new Uint8Array([13, 10, 13, 10]) // \r\n\r\n

const indexOfBytes = (buffer: Uint8Array, pattern: Uint8Array, startIndex?: number): number => {
  while (true) {
    const index = buffer.indexOf(pattern[0], startIndex)

    if (index === -1 || index + pattern.length > buffer.length) {
      return -1
    }

    if (pattern.every((byte, patternIndex) => buffer[index + patternIndex] === byte)) {
      return index
    }

    startIndex = index + 1
  }
}

const mjpegStream = async (url: string, sendFrame: (data: Uint8Array<ArrayBuffer>) => void) => {
  const response = await fetch(url, {
    mode: 'cors'
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch MJPEG stream: ${response.status}`)
  }

  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('multipart')) {
    throw new Error(`Invalid content-type "${contentType}"`)
  }

  const boundary = contentType.match(/boundary=([^;]+)/)?.[1]

  if (!boundary) {
    throw new Error(`Boundary not found in content-type "${contentType}"`)
  }

  const boundaryBytes = new TextEncoder().encode(`--${boundary}`)

  const reader = response.body!.getReader({
    mode: 'byob'
  })

  let buffer = new Uint8Array(0)

  try {
    while (true) {
      const chunk = new Uint8Array(chunkSize)
      const { done, value } = await reader.read(chunk)

      if (done) {
        break
      }

      const newBuffer = new Uint8Array(buffer.length + value.length)
      newBuffer.set(buffer)
      newBuffer.set(value, buffer.length)
      buffer = newBuffer

      while (true) {
        const boundaryStart = indexOfBytes(buffer, boundaryBytes)

        if (boundaryStart === -1) {
          break
        }

        const frameStart = boundaryStart + boundaryBytes.length

        const nextBoundaryStart = indexOfBytes(buffer, boundaryBytes, frameStart)

        if (nextBoundaryStart === -1) {
          break
        }

        const headerEnd = indexOfBytes(buffer, headerEndPattern, frameStart)

        if (headerEnd !== -1 && headerEnd < nextBoundaryStart) {
          const frameData = buffer.slice(headerEnd + 4, nextBoundaryStart)

          sendFrame(frameData)
        }

        buffer = buffer.slice(nextBoundaryStart)
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export default mjpegStream
