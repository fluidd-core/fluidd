import { LocaleInfo } from '../helper'

export const info = new LocaleInfo('it', 'it', 'Italiano')
export default {
  app: {
    updater: {
      title: 'Aggiornamenti Software',
      to: 'alla {version}',
      check: 'Controlla gli aggiornamenti'
    },
    warnings: {
      found: '{appName} warnings found.',
      failedPlugins: 'Moonraker ha dei plugin in errore, controlla i logs, aggiorna la tua configurazione e riavvia Moonraker.',
      fluiddReq: ['I requisiti per Fluidd li trovi ', 'qua.'],
      moonrakerPluginConfig: ['Le configurazioni dei plugin di Moonraker le trovi ', 'qua.']
    },
    host: {
      title: 'Host',
      reboot: { title: 'Riavvia', confirm: 'Sicuro di voler riavviare l\'host?' },
      shutdown: { title: 'Spegni', confirm: 'Sicuro di voler spegnere l\'host?' },
      powerPlugin: 'Plugin Alimentazione'
    },
    services: {
      title: 'Servizi',
      restart: {
        moonraker: 'Riavvia Moonraker',
        klipper: 'Riavvia Klipper',
        firmware: 'Riavvia Firmware Klipper'
      }
    },
    degree: {
      celsius: '°C'
    },
    connection: {
      try: 'Connessione a Moonraker in corso...',
      fail: 'Nessuna connessione a Moonraker. Si prega di controllarne lo stato o di eseguire un refresh.'
    },
    form: {
      required: 'Obbligatorio',
      invalidUrl: 'URL Invalido',
      min: 'Minimo {min}',
      max: 'Massimo {max}',
      minOr: 'Minimo {min} o {alt}',
      maxOr: 'Massimo {max} o {alt}'
    },
    chips: {
      active: 'attivo'
    },
    btn: {
      close: 'Chiudi',
      pause: 'Pausa',
      cancel: 'Cancella',
      resume: 'Riprendi',
      resetFile: 'Resetta File',
      resetDefault: 'Resetta a Default',
      reprint: 'Ristampa',
      on: 'On',
      off: 'Off',
      standy: 'Standby',
      enabled: 'Attivo',
      add: 'Aggiungi',
      save: 'Salva',
      no: 'No',
      yes: 'Si',
      saveClose: '@:app.btn.save e @:app.btn.close',
      saveRestart: '@:app.btn.save e Riavvia',
      finish: 'Finisci',
      updating: 'Aggiornando...',
      uploading: 'Caricando...',
      processing: 'Processando...',
      all: 'Tutti',
      refresh: 'Ricarica',
      retract: 'Ritrai',
      extrude: 'Estrudi',
      forceRefresh: 'Ricarica forzata'
    },
    bar: {
      dashboard: 'Cruscotto',
      jobs: 'Lavori',
      printer: 'Stampante',
      estop: 'Fermo d\'emergenza'
    },
    drawer: {
      pconfig: 'Impostazioni Stampante',
      uiSettings: 'Impostazioni Grafica'
    },
    versionStatus: {
      updated: { msg: 'AGGIORNATO', dialog: 'Aggiornamento Finito' },
      update: { msg: 'AGGIORNABILE', dialog: 'Aggiornando, aspetta...' },
      dirty: { msg: 'SPORCO', desc: 'Indica aggiornamenti Locali alla repo' },
      invalid: { msg: 'INVALIDO', desc: 'Indica un head staccato dal master o con un origine invalida' }
    },
    i18n: {
      title: 'Internalizzazione',
      choose: 'Scegli la lingua:',
      languages: 'Lingue',
      auto: 'Automatica'
    },
    theme: {
      title: 'Tema',
      subTitle: 'Imposta un colore principale e se usare il tema Scuro',
      darkMode: 'Tema Scuro'
    },
    layout: {
      title: 'Layout',
      adjust: 'Modifica layout Cruscotto',
      reset: 'Ripristina layout Cruscotto'
    }
  },
  printer: {
    title: 'Stampanti',
    add: {
      title: 'Aggiungi Stampante',
      another: 'Aggiungi un altra Stampante',
      apiUrl: 'Indirizzo API',
      tooltip: [
        'Scrivi il tuo @.upper:printer.add.apiUrl.',
        'Alcuni esempi;'
      ],
      docs: [
        'Problemi?',
        'Guarda qua',
        'per maggiori informazioni.'
      ]
    },
    bed: {
      mesh: {
        title: 'Mesh del Letto',
        empty: 'Nessuna mesh trovata.',
        name: 'Nome',
        variance: 'Varianza',
        load: 'Carica Profilo',
        delete: 'Cancella Profilo. Attenzione la stampante viene RIAVVIATA',
        clear: 'Pulisci Profilo',
        calibrate: { text: 'Calibra', tooltip: 'Inizia una nuova Calibrazione, salva come profilo \'default\'' },
        saveAs: {
          text: 'Salva Configurazione Come...',
          tooltip: 'Scrivi il profilo Calibrato in printer.cfg. Attenzione la stampante viene RIAVVIATA.',
          name: 'Nome Profilo',
          remove: 'Rimuovi il profilo: {name}',
          help: 'Se stai salvando con un altro nome invece di {name} puoi scegliere anche di cancellarlo.'
        }
      },
      adjustaments: {
        title: 'Correzzioni Letto'
      }
    },
    sensors: {
      endstops: {
        title: 'Blocca Assi',
        subTitle: 'Usa il tasto di ricarica per aggiornare lo stato dei blocca assi.',
        state: {
          open: 'SBLOCCATO',
          triggered: 'BLOCCATO'
        }
      },
      runout: {
        title: 'Sensori dei filamenti'
      }
    },
    logs: {
      title: 'Logs Stampanti'
    },
    camera: {
      title: 'Videocamera',
      flipH: 'Capovolgi Orizzontalmente',
      flipV: 'Capovolgi Verticalmente',
      stream: {
        label: 'Tipo Stream',
        url: 'Indirizzo Videocamera',
        types: {
          mjpgstreamer: 'mjpgstreamer',
          ipcamera: 'ip camera'
        }
      }
    },
    console: {
      title: 'Terminale',
      hideTemp: 'Nascondi attesa temperature', // i'm not sure of what this do...
      placeHolder: '\'tab\' per l\'autocompletamento, \'frecce\' per la storia, scrivi \'help\' per i comandi'
    },
    jobs: {
      title: 'Lavori',
      disabledTooltip: 'I lavori sono disattivati prima della connessione iniziale con klippy'
    },
    macros: {
      title: 'Macro',
      subTitle: 'Configura quali macro mostrare nel Cruscotto'

    },
    outputs: {
      title: 'Ventole e Uscite',
      fans: {
        fan: 'Ventola Stampa',
        stepstick_fan: 'Ventola Stepstick',
        extruder_fan: 'Ventola Estrusore'
      }
    },
    limits: {
      title: 'Limite Stampa',
      speed: 'Velocità',
      acceleration: 'Accelerazione',
      squareCornerSpeed: 'Velocità angoli retti',
      accelDecel: 'Da Accelerazione a Decelerazione'
    },
    status: {
      title: 'Stato',
      confirmCancel: 'Sicuro di voler cancellare la Stampa?.',
      etl: 'Tempo Rimanente (Stimato)',
      durationTotal: 'Durata / Totale',
      duration: 'Durata',
      filamentEstimate: 'Filamento usato',
      klippy: {
        title: 'Klippy: {klippyState}',
        restart: {
          klippy: 'Riavvia Klipper',
          service: 'Riavvia Firmware'
        }
      }
    },
    temperature: {
      title: 'Temperature',
      tooltip: 'Tieni premuto shift per ingrandire.<br />Tocca un elemento per mostrarlo nel grafico<br />Tocca una potenza per mostrarla nel grafico',
      preset: {
        title: 'Preset Temperature',
        subTitle: 'Applica temperature predefinite nel Cruscotto',
        add: 'Aggiungi',
        edit: 'Modifica',
        name: 'Nome'
      },
      heaters: {
        extruder: 'Estrusore',
        heater_bed: 'Letto'
      },
      status: {
        item: 'Elemento',
        power: 'Potenza',
        current: 'Attuale',
        target: 'Obiettivo',
        allOff: 'Spegni Tutti'
      },
      high: 'maggiore {temp} {degree}',
      low: 'minore {temp} {degree}'
    },
    tool: {
      title: 'Strumenti',
      tooltip: 'Estrusore disattivato, sotto la temperatura minima di {minExtrudeTemp}<small>{degree}</small> (min_extrude_temp)',
      motorsOff: 'Spegni Motori',
      bedScrewAdjust: 'Correggi Viti Letto',
      screwsTiltCalculate: 'Calcola l\'inclinazione delle viti',
      zTiltAdjust: 'Correggi inclinazione asse Z',
      qgl: 'QGL',
      invert: {
        x: 'Inverti X',
        y: 'Inverti Y',
        z: 'Inverti Z'
      },
      useGCodeCoord: {
        text: 'Usa Coordinate GCode',
        tooltip: 'Usa Coordinate GCode invece della posizione della testina nel Cruscotto'
      },
      default: {
        eLength: 'Lunghezza Estrusione di Default',
        eSpeed: 'Velocità di Estrusione di Default',
        moveLength: 'Lunghezza movimento di Default della testina',
        xyMoveSpeed: 'Velocità di movimento di Default della testina sugli assi XY',
        zMoveSpeed: 'Velocità di movimento di Default della testina sull\'asse Z'
      },
      current: {
        rSpeed: 'Velocità Richiesta:',
        eLength: 'Lunghezza Estrusione',
        eSpeed: 'Velocità di Estrusione',
        xyzMoveSpeed: 'Velocità',
        eFlow: 'Flusso',
        zOffset: 'Sfasamento asse Z: '
      },
      home: {
        xy: 'Home XY',
        z: 'Home Z'
      }
    },
    misc: {
      title: 'Generali',
      name: 'Nome Stampante'
    },
    timeEstimate: {
      title: 'Tempi di Stampa',
      types: {
        totals: {
          text: 'Solo Durata',
          tooltip: 'Simile a un LCD klipper, mostra solo la durata senza stime.'
        },
        slicer: {
          text: 'Stima dallo Slicer',
          tooltip: 'Usa lo slicer per la stima da mostrare. Devi attivarlo nel tuo slicer.'
        },
        file: {
          text: 'Stima dal File',
          tooltip: 'Usa la percentuale di progresso e la durata attuale per stimare la durata totale.<br />La precisione migliora nel tempo.'
        },
        filament: {
          text: 'Stima dal Filamento',
          tooltip: 'Usa la differenza di filamento usato e quello stimato per stimare la durata totale.<br />La precisione migliora nel tempo.'
        }
      }
    },
    fileSystem: {
      drag: ['Trascina', 'un file qua'],
      empty: 'Nessun file',
      emptySearch: '@:printer.fileSystem.empty trovato',
      search: 'Cerca',
      action: {
        print: 'Stampa',
        edit: 'Modifica',
        view: 'Visualizza',
        download: 'Scarica',
        rename: 'Rinomina',
        remove: 'Cancella',
        createDir: 'Crea Cartella',
        addFolder: 'Aggiungi Cartella',
        createFile: 'Crea File',
        upload: 'Carica',
        uploadPrint: 'Carica e Stampa',
        uploadFiles: ['Caricando', 'File']
      },
      headers: {
        name: 'Nome',
        modified: 'Modificato',
        size: 'Peso',
        filament: 'Filamento',
        height: 'Altezza',
        'layer height': 'Altezza Strato',
        'estimated time': 'Tempo Stimato'
      }
    }
  }
}
