import type { Dispatch } from 'vuex'
import type { RootState } from './types'
import { SocketActions } from '@/api/socketActions'
import type { AppPushNotification } from './notifications/types'
import i18n from '@/plugins/i18n'
import type { KlippyApp } from './printer/types'

export const handleTrinamicDriversChange = (payload: any, state: RootState, dispatch: Dispatch, getters: any) => {
  for (const item in payload) {
    const [type, nameFromSplit] = item.split(' ', 2)

    if (
      /^tmc\d{4}$/.test(type) &&
      payload[item]?.drv_status?.otpw != null &&
      state.printer.printer?.[item]?.drv_status?.otpw == null
    ) {
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

export const handlePrintStateChange = (payload: any, state: RootState, dispatch: Dispatch) => {
  // For every notify - if print_stats.state changes from standby -> printing,
  // then record an entry in our print history.
  // If the state changes from printing -> complete, then record the finish time.
  if (
    'print_stats' in payload &&
    'state' in payload.print_stats
  ) {
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

export const handleCurrentFileChange = (payload: any, state: RootState) => {
  if (
    'print_stats' in payload &&
    'filename' in payload.print_stats &&
    payload.print_stats.filename &&
    payload.print_stats.filename !== state.printer.printer.print_stats?.filename
  ) {
    // This refreshes the metadata for the current file, which also
    // ensures we update the printer file with the latest data via
    // the files/onFileUpdate action.
    SocketActions.serverFilesMetadata(payload.print_stats.filename)
  }
}
