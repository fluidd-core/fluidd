import {
  Thumbnail
} from './files/types'
import { SocketActions } from '@/api/socketActions'
import store from '@/store'

export const isOfType = <T> (
  varToBeChecked: any,
  propertyToCheckFor: keyof T
): varToBeChecked is T => (varToBeChecked as T)[propertyToCheckFor] !== undefined

/**
 * Return a file thumb if one exists
 * Optionally, pick the largest or smallest image.
 */
export const getThumb = (thumbnails: Thumbnail[], path: string, goLarge = true) => {
  const apiUrl = store.state.config?.apiUrl
  if (thumbnails.length) {
    let thumb: Thumbnail | undefined
    if (thumbnails) {
      if (goLarge) {
        thumb = thumbnails.reduce((a, c) => (a.size && c.size && (a.size > c.size)) ? a : c)
      } else {
        thumb = thumbnails.reduce((a, c) => (a.size && c.size && (a.size < c.size)) ? a : c)
      }
      if (thumb) {
        if (thumb.relative_path && thumb.relative_path.length > 0) {
          return {
            ...thumb,
            absolute_path: (path === '')
              ? encodeURI(`${apiUrl}/server/files/gcodes/${thumb.relative_path}`)
              : encodeURI(`${apiUrl}/server/files/gcodes/${path}/${thumb.relative_path}`)
          }
        }
        if (thumb.data) {
          return {
            ...thumb,
            data: 'data:image/gif;base64,' + thumb.data
          }
        }
      }
    }
  }
}

export const handlePrintStateChange = (payload: any) => {
  // For every notify - if print_stats.state changes from standby -> printing,
  // then record an entry in our print history.
  // If the state changes from printing -> complete, then record the finish time.
  if (
    'print_stats' in payload &&
    'state' in payload.print_stats
  ) {
    if (
      store.state.printer?.printer.print_stats.state === 'standby' &&
      payload.print_stats.state === 'printing'
    ) {
      // This is a new print starting...
      store.dispatch('printer/onPrintStart', payload)
    } else if (
      store.state.printer?.printer.print_stats.state === 'printing' &&
      payload.print_stats.state === 'complete'
    ) {
      // This is a completed print...
      store.dispatch('printer/onPrintEnd', payload)
    } else if (
      store.state.printer?.printer.print_stats.state === 'printing' &&
      payload.print_stats.state === 'standby'
    ) {
      // This is a cancelled print...
      store.dispatch('printer/onPrintEnd', payload)
    }
  }
}

export const handleCurrentFileChange = (payload: any) => {
  if (
    'print_stats' in payload &&
    'filename' in payload.print_stats &&
    payload.print_stats.filename !== store.state.printer?.printer.print_stats.filename
  ) {
    store.commit('printer/setResetCurrentFile')
    if (
      payload.print_stats.filename !== '' &&
      payload.print_stats.filename !== null
    ) {
      // This refreshes the metadata for the current file, which also
      // ensures we update the current_file with the latest data via
      // the files/onFileUpdate action.
      SocketActions.serverFilesMetaData(payload.print_stats.filename)
    }
  }
}
