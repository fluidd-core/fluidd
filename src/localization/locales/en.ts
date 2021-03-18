import { LocaleInfo } from '../helper'

export const info = new LocaleInfo('us', 'en', 'English')
export default {
  btn: {
    close: 'Close'
  },
  appBar: {
    dashboard: 'Dashboard',
    jobs: 'Jobs',
    printer: 'Printer',
    estop: 'Emergency Stop'
  },
  appDrawer: {
    pconfig: 'Printer Configuration',
    uiSettings: 'UI Settings'
  },
  versionStatus: {
    updated: { msg: 'UP TO DATE' },
    update: { msg: 'UPDATE' },
    dirty: { msg: 'DIRTY', desc: 'indicates local changes to the repo' },
    invalid: { msg: 'INVALID', desc: 'indicates a detached head, not on master or an invalid origin' }
  },
  i18n: {
    title: 'Internalization',
    choose: 'Choose your language:',
    languages: 'Languages',
    auto: 'Automatic'
  }
}
