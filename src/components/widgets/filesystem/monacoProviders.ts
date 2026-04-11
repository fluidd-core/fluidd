import type Vue from 'vue'
import getVueApp from '@/util/get-vue-app'
import type { KlippyApp, SupportedKlipperServices } from '@/store/printer/types'

import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import type { MonacoLanguageWorkerRequestMessage, MonacoLanguageWorkerResponseMessage } from '@/workers/monacoWorkerHelpers'

import type { MonacoDocumentSymbolsWorkerResponseMessage } from '@/workers/monacoDocumentSymbolsWorker'
import MonacoDocumentSymbolsWorker from '@/workers/monacoDocumentSymbolsWorker?worker'

import type { MonacoFoldingRangesWorkerResponseMessage } from '@/workers/monacoFoldingRangesWorker'
import MonacoFoldingRangeWorker from '@/workers/monacoFoldingRangesWorker?worker'

import type { MonacoCodeLensWorkerResponseMessage } from '@/workers/monacoCodeLensWorker'
import MonacoCodeLensWorker from '@/workers/monacoCodeLensWorker?worker'

export type CodeLensSupportedService = 'klipper' | 'moonraker' | 'moonraker-telegram-bot' | 'crowsnest'

export type DocsSectionService = CodeLensSupportedService | SupportedKlipperServices

abstract class MonacoProviderBase<T> {
  protected _lastCacheKey: string | null = null
  protected _lastResult: T[] = []

  protected _workerWrapper<T extends MonacoLanguageWorkerResponseMessage<U>, U = Extract<T, { action: 'result' }>['result']>(WorkerConstructor: new () => Worker, language: string, content: string, token: monaco.CancellationToken): Promise<U | undefined> {
    return new Promise<U | undefined>((resolve, reject) => {
      if (token.isCancellationRequested) {
        resolve(undefined)
        return
      }

      const worker = new WorkerConstructor()

      let tokenDispose: monaco.IDisposable | null = null

      const cleanup = () => {
        tokenDispose?.dispose()
        worker.onmessage = null
        worker.onerror = null
        worker.onmessageerror = null
        worker.terminate()
      }

      const safeResolve = (value: U | undefined) => {
        cleanup()
        resolve(value)
      }

      const safeReject = (error: unknown) => {
        cleanup()
        reject(error)
      }

      tokenDispose = token.onCancellationRequested(() => {
        safeResolve(undefined)
      })

      worker.onmessage = (event: MessageEvent<T>) => {
        const message = event.data

        switch (message.action) {
          case 'result':
            safeResolve(message.result)

            break

          case 'error':
            safeReject(message.error)

            break
        }
      }

      worker.onerror = (event) => {
        safeReject(new Error(event.message || 'Worker error'))
      }

      worker.onmessageerror = () => {
        safeReject(new Error('Worker message error'))
      }

      const message: MonacoLanguageWorkerRequestMessage = {
        language,
        content
      }

      if (!token.isCancellationRequested) {
        worker.postMessage(message)
      }
    })
  }

  protected _createCacheKey (model: monaco.editor.ITextModel): string {
    return `${model.uri.toString()}@${model.getVersionId()}`
  }
}

export class MonacoDocumentSymbolProvider extends MonacoProviderBase<monaco.languages.DocumentSymbol> implements monaco.languages.DocumentSymbolProvider {
  public async provideDocumentSymbols (model: monaco.editor.ITextModel, token: monaco.CancellationToken): Promise<monaco.languages.DocumentSymbol[]> {
    const cacheKey = this._createCacheKey(model)

    if (this._lastCacheKey !== cacheKey) {
      const result = await this._workerWrapper<MonacoDocumentSymbolsWorkerResponseMessage>(MonacoDocumentSymbolsWorker, 'klipper-config', model.getValue(), token)

      if (result == null) {
        return []
      }

      this._lastResult = result.map(section => ({
        name: section.name,
        detail: section.name,
        kind: monaco.languages.SymbolKind.Namespace,
        range: section.range,
        selectionRange: section.range,
        tags: [],
        children: section.children.map(child => ({
          name: child.name,
          detail: child.name,
          kind: monaco.languages.SymbolKind.Property,
          range: child.range,
          selectionRange: child.range,
          tags: []
        }))
      }))
      this._lastCacheKey = cacheKey
    }

    return this._lastResult
  }
}

export class MonacoCodeLensProvider extends MonacoProviderBase<monaco.languages.CodeLens> implements monaco.languages.CodeLensProvider {
  private _app: Vue
  private _klippyApp: KlippyApp

  constructor () {
    super()
    this._app = getVueApp()
    this._klippyApp = this._app.$typedGetters['printer/getKlippyApp']
  }

  public async provideCodeLenses (model: monaco.editor.ITextModel, token: monaco.CancellationToken): Promise<monaco.languages.CodeLensList> {
    return {
      lenses: await this._getCodeLens(model, token),
      dispose: () => undefined
    }
  }

  private async _getCodeLens (model: monaco.editor.ITextModel, token: monaco.CancellationToken): Promise<monaco.languages.CodeLens[]> {
    const cacheKey = this._createCacheKey(model)

    if (this._lastCacheKey !== cacheKey) {
      const { service } = this._app.$typedGetters['server/getConfigMapByFilename'](model.uri.path.split('/').pop()!) ?? {}

      if (
        !service ||
        !this._isCodeLensSupportedService(service)
      ) {
        return []
      }

      const docsSectionService: DocsSectionService = service === 'klipper'
        ? this._klippyApp.name
        : service

      const result = await this._workerWrapper<MonacoCodeLensWorkerResponseMessage>(MonacoCodeLensWorker, 'klipper-config', model.getValue(), token)

      if (result == null) {
        return []
      }

      this._lastResult = result.map((section, index) => {
        const hash = this._getDocsSectionHash(docsSectionService, section.sectionName)

        return {
          range: section.range,
          id: `docs${index}`,
          command: {
            id: 'fluidd_open_docs',
            title: this._app.$t('app.file_system.label.view_section_documentation', { section: section.sectionName }).toString(),
            arguments: [service, hash]
          }
        }
      })
      this._lastCacheKey = cacheKey
    }

    return this._lastResult
  }

  private _isCodeLensSupportedService (service: string): service is CodeLensSupportedService {
    return [
      'klipper',
      'moonraker',
      'moonraker-telegram-bot',
      'crowsnest'
    ].includes(service)
  }

  private _getDocsSectionHash (service: DocsSectionService, sectionName: string): string {
    switch (service) {
      case 'klipper':
        if (sectionName.startsWith('stepper_')) {
          return 'stepper'
        }

        if (/^extruder\d{0,2}$/.test(sectionName)) {
          return 'extruder'
        }

        break

      case 'danger-klipper':
        if (sectionName === 'danger_options') {
          return 'danger-options'
        }

        return this._getDocsSectionHash('klipper', sectionName)

      case 'kalico':
        if (sectionName === 'danger_options') {
          return 'danger-options'
        }

        if (sectionName === 'constants') {
          return 'configuration-references'
        }

        return this._getDocsSectionHash('klipper', sectionName)

      case 'moonraker':
        if (sectionName.startsWith('include')) {
          return 'include-directives'
        }

        break
    }

    return sectionName
  }
}

export class MonacoFoldingRangeProvider extends MonacoProviderBase<monaco.languages.FoldingRange> implements monaco.languages.FoldingRangeProvider {
  public async provideFoldingRanges (model: monaco.editor.ITextModel, _context: monaco.languages.FoldingContext, token: monaco.CancellationToken): Promise<monaco.languages.FoldingRange[]> {
    const cacheKey = this._createCacheKey(model)

    if (this._lastCacheKey !== cacheKey) {
      const result = await this._workerWrapper<MonacoFoldingRangesWorkerResponseMessage>(MonacoFoldingRangeWorker, model.getLanguageId(), model.getValue(), token)

      if (result == null) {
        return []
      }

      this._lastResult = result.map((range): monaco.languages.FoldingRange => {
        const kind = range.kind === 'comment'
          ? monaco.languages.FoldingRangeKind.Comment
          : monaco.languages.FoldingRangeKind.Region

        return {
          start: range.start,
          end: range.end,
          kind
        }
      })
      this._lastCacheKey = cacheKey
    }

    return this._lastResult
  }
}
