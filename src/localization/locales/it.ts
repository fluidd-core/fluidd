import { LocaleInfo } from '../helper'

export const info = new LocaleInfo('it', 'it', 'Italiano')
export default {
  btn: {
    close: 'Chiudi'
  },
  appBar: {
    dashboard: 'Cruscotto',
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
  },
  bed: {
    mesh: {
      title: 'Mesh Letto',
      adjustaments: {
        title: 'Ritocchi Letto'
      }
    }
  },
  endstops: {
    title: 'Endstops',
    subTitle: 'Premi il pulsante di ricarica per aggiornare lo stato degli endstop.',
    state: {
      open: 'SPENTO',
      triggered: 'ATTIVO'
    }
  }
}
