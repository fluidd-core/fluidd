import { LocaleInfo } from '../helper'

export const info = new LocaleInfo('it', 'it', 'Italiano')
export default {
  btn: {
    close: 'Chiudi'
  },
  appBar: {
    dashboard: 'Dashboard',
    jobs: 'Lavori',
    printer: 'Stampante',
    estop: "Blocco d'emergenza"
  },
  appDrawer: {
    pconfig: 'Impostazioni Stampante',
    uiSettings: 'Impostazioni Interfaccia'
  },
  versionStatus: {
    updated: { msg: 'AGGIORNATO' },
    update: { msg: 'AGGIORNA' },
    dirty: { msg: 'SPORCO', desc: 'indica che ci sono modifiche locali al repo' },
    invalid: { msg: 'INVALIDO', desc: 'indica un head scollegato, non è collegato al master o ad altre origini' }
  },
  i18n: {
    title: 'Internalizzazione',
    choose: 'Scegli la Lingua:',
    languages: 'Lingue',
    auto: 'Automatico'
  }
}
