import type { Dispatch } from 'vuex'
import type { RootState } from './types'
import { SocketActions } from '@/api/socketActions'
import type { AppPushNotification } from './notifications/types'
import i18n from '@/plugins/i18n'
import type { KlipperPrinterState, KlippyApp, TmcKey } from './printer/types'
import getFilePaths from '@/util/get-file-paths'

const isTmc = (item: string): item is TmcKey => /^tmc\d{4} /.test(item)

export const handleTrinamicDriversChange = (payload: KlipperPrinterState, state: RootState, dispatch: Dispatch, getters: any) => {
  for (const item in payload) {
    if (
      isTmc(item) &&
      payload[item]?.drv_status?.otpw != null &&
      state.printer.printer?.[item]?.drv_status?.otpw == null
    ) {
      const [, nameFromSplit] = item.split(' ', 2)
      const name = nameFromSplit ?? item

      const klippyApp: KlippyApp = getters.getKlippyApp

      const notification: AppPushNotification = {
        id: `${item}-otpw`,
        title: i18n.t('app.printer.title.stepper_driver_overheating', { name }).toString(),
        description: i18n.t('app.printer.msg.possible_print_failure').toString(),
        to: i18n.t('app.printer.url.stepper_driver_overheating', { klipperDomain: klippyApp.domain }).toString(),
        type: 'error',
        snackbar: true,
        merge: true,
        clear: true,
        noCount: true
      }

      dispatch('notifications/pushNotification', notification, { root: true })
    }
  }
}

export const handlePrintStateChange = (payload: KlipperPrinterState, state: RootState, dispatch: Dispatch) => {
  // For every notify - if print_stats.state changes from standby -> printing,
  // then record an entry in our print history.
  // If the state changes from printing -> complete, then record the finish time.
  if (payload.print_stats?.state != null) {
    const currentPrintState = state.printer.printer.print_stats?.state

    if (
      currentPrintState !== 'printing' &&
      payload.print_stats.state === 'printing'
    ) {
      // This is a new print starting...
      dispatch('printer/onPrintStart', payload, { root: true })
    } else if (
      currentPrintState === 'printing' &&
      payload.print_stats.state === 'complete'
    ) {
      // This is a completed print...
      dispatch('printer/onPrintEnd', payload, { root: true })
    } else if (
      currentPrintState === 'printing' &&
      payload.print_stats.state === 'standby'
    ) {
      // This is a cancelled print...
      dispatch('printer/onPrintEnd', payload, { root: true })
    }
  }
}

export const handleCurrentFileChange = (payload: KlipperPrinterState, state: RootState) => {
  if (
    payload.print_stats?.filename &&
    payload.print_stats.filename !== state.printer.printer.print_stats?.filename
  ) {
    const { rootPath } = getFilePaths(payload.print_stats.filename, 'gcodes')

    const directoryLoaded = rootPath in state.files.pathFiles

    // Load the folder containing the currently printing file if we haven't done that already
    if (!directoryLoaded) {
      SocketActions.serverFilesGetDirectory(rootPath)
    }
  }
}
