export type MonacoLanguageWorkerRequestMessage = {
  language: string,
  content: string
}

export type MonacoLanguageWorkerResponseMessage<T> = {
  action: 'result',
  result: T
} | {
  action: 'error',
  error?: unknown
}

export type ReduceState<T> = {
  current?: T,
  result: T[]
}

export type StackReduceState<U, T> = {
  stack: U[],
  result: T[]
}

export const getFirstNonWhitespaceColumn = (line: string): number => {
  const match = /\S/.exec(line)

  return match ? match.index + 1 : 1
}

export const getLastNonWhitespaceColumn = (line: string): number => {
  const match = /\S\s*$/.exec(line)

  return match ? match.index + 2 : 1
}
