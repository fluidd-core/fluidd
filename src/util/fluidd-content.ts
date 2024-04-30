type FluiddContent<T> = {
  meta: {
    app: 'Fluidd',
    version: string,
    type: string
  },
  data: T
}

export const isFluiddContent = <T>(type: string, content: unknown): content is FluiddContent<T> => {
  return (
    content != null &&
    typeof (content) === 'object' &&
    'meta' in content &&
    content.meta != null &&
    typeof (content.meta) === 'object' &&
    'app' in content.meta &&
    typeof (content.meta.app) === 'string' &&
    content.meta.app === 'Fluidd' &&
    'type' in content.meta &&
    typeof (content.meta.type) === 'string' &&
    content.meta.type === type &&
    'data' in content
  )
}

export const toFluiddContent = <T>(type: string, data: T): FluiddContent<T> => {
  return {
    meta: {
      app: 'Fluidd',
      version: import.meta.env.VERSION,
      type
    },
    data
  }
}
