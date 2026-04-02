import type { IRange } from 'monaco-editor/esm/vs/editor/editor.api'

export type MonacoEditorLanguageWorkerServerMessage = {
  action: 'getFoldingRanges' | 'getDocumentSymbols' | 'getCodeLens',
  content: string
}

export type MonacoEditorLanguageWorkerClientMessage = {
  action: 'resultFoldingRanges',
  result: MonacoEditorFoldingRange[]
} | {
  action: 'resultDocumentSymbols',
  result: MonacoEditorSymbol[]
} | {
  action: 'resultCodeLens',
  result: MonacoEditorCodeLens[]
} | {
  action: 'error',
  error?: unknown
}

export type MonacoEditorFoldingRangeKind = 'comment' | 'region'

export type MonacoEditorFoldingRange = {
  kind: MonacoEditorFoldingRangeKind,
  start: number,
  end: number
}

export type MonacoEditorSymbol = {
  name: string,
  range: IRange,
  children: MonacoEditorSymbolChild[]
}

export type MonacoEditorSymbolChild = {
  name: string,
  range: IRange
}

export type MonacoEditorCodeLens = {
  sectionName: string,
  range: IRange
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
