import { ChartConfiguration } from '@/types'
import {
  mdiHome,
  mdiClose,
  mdiTune,
  mdiMinus,
  mdiPlus,
  mdiCheck,
  mdiFire,
  mdiCogOutline,
  mdiCarBrakeAlert,
  mdiPrinter3d,
  mdiPrinter3dNozzleOutline,
  mdiFileCodeOutline,
  mdiTools,
  mdiConsole,
  mdiFileMultipleOutline,
  mdiChevronUp,
  mdiChevronDown,
  mdiTimerSand,
  mdiClockOutline,
  mdiFormatLineSpacing,
  mdiFileDocumentOutline,
  mdiPause,
  mdiWindowClose,
  mdiPlayBoxOutline,
  mdiPrinter,
  mdiCamera,
  mdiFan,
  mdiArrowUp,
  mdiArrowDown,
  mdiArrowLeft,
  mdiArrowRight,
  mdiArrowCollapseUp,
  mdiArrowCollapseDown,
  mdiViewGridOutline,
  mdiArrowExpandHorizontal,
  mdiRefresh,
  mdiCheckboxMarkedCircle,
  mdiCheckCircleOutline,
  mdiCheckboxBlankCircleOutline,
  mdiHazardLights,
  mdiPrinter3dNozzleAlertOutline,
  mdiAlertCircle,
  mdiFolderPlus,
  mdiFolderUpload,
  mdiFile,
  mdiFolder,
  mdiPencil,
  mdiMagnify,
  mdiDownload,
  mdiFormTextbox,
  mdiDeleteAlertOutline,
  mdiCogs,
  mdiContentSaveOutline,
  mdiAlert
} from '@mdi/js'

/**
 * Global, static constants.
 */
export const Globals = Object.freeze({
  CONSOLE_HISTORY_RETENTION: 1000,
  CONSOLE_RECEIVE_PREFIX: 'Recv:',
  CONSOLE_SEND_PREFIX: 'Send:',
  KLIPPY_RETRY_DELAY: 2000,
  LOCAL_STORAGE_KEY: 'appConfig',
  SETTINGS_FILENAME: '.fluidd.json'
})

export const Icons = Object.freeze({
  home: mdiHome,
  close: mdiClose,
  refresh: mdiRefresh,
  alert: mdiAlert,
  hazard: mdiHazardLights,
  blankCircle: mdiCheckboxBlankCircleOutline,
  markedCircle: mdiCheckboxMarkedCircle,
  checkedCircle: mdiCheckCircleOutline,
  alertCircle: mdiAlertCircle,
  folderAdd: mdiFolderPlus,
  folder: mdiFolder,
  folderUp: mdiFolderUpload,
  up: mdiArrowUp,
  down: mdiArrowDown,
  left: mdiArrowLeft,
  right: mdiArrowRight,
  tune: mdiTune,
  upCollapse: mdiArrowCollapseUp,
  downCollapse: mdiArrowCollapseDown,
  expandHorizontal: mdiArrowExpandHorizontal,
  cog: mdiCogOutline,
  cogs: mdiCogs,
  save: mdiContentSaveOutline,
  estop: mdiCarBrakeAlert,
  fire: mdiFire,
  tools: mdiTools,
  minus: mdiMinus,
  plus: mdiPlus,
  check: mdiCheck,
  console: mdiConsole,
  clock: mdiClockOutline,
  filamentEstimate: mdiFormatLineSpacing,
  chevronUp: mdiChevronUp,
  chevronDown: mdiChevronDown,
  timer: mdiTimerSand,
  fileCode: mdiFileCodeOutline,
  files: mdiFileMultipleOutline,
  fileDocument: mdiFileDocumentOutline,
  file: mdiFile,
  pause: mdiPause,
  cancel: mdiWindowClose,
  resume: mdiPlayBoxOutline,
  reprint: mdiPrinter,
  printer: mdiPrinter,
  download: mdiDownload,
  rename: mdiFormTextbox,
  delete: mdiDeleteAlertOutline,
  camera: mdiCamera,
  fan: mdiFan,
  pencil: mdiPencil,
  magnify: mdiMagnify,
  printer3d: mdiPrinter3d,
  printer3dNozzle: mdiPrinter3dNozzleOutline,
  printer3dNozzleAlert: mdiPrinter3dNozzleAlertOutline,
  bedMesh: mdiViewGridOutline
})

export const Waits = Object.freeze({
  onHomeAll: 'onHomeAll',
  onHomeXY: 'onHomeXY',
  onHomeZ: 'onHomeZ',
  onQGL: 'onQGL',
  onZTilt: 'onZTilt',
  onPrintPause: 'onPrintPause',
  onPrintCancel: 'onPrintCancel',
  onPrintResume: 'onPrintResume',
  onMacro: 'onMacro',
  onGetDirectory: 'getDirectory',
  onSetSpeed: 'onSetSpeed',
  onSetFlow: 'onSetFlow',
  onSetFanSpeed: 'onSetFanSpeed',
  onZAdjust: 'onZAdjust',
  onRetract: 'onRetract',
  onExtrude: 'onExtrude',
  onMeshCalibrate: 'onMeshCalibrate',
  onRestart: 'restart',
  onFirmwareRestart: 'restart',
  onSetVelocity: 'onSetVelocity',
  onSetAcceleration: 'onSetAcceleration',
  onSetDeceleration: 'onSetDeceleration',
  onSetSCV: 'onSetSCV'
})

/* eslint-disable @typescript-eslint/camelcase */
export const chartConfiguration: ChartConfiguration = Object.freeze({
  HISTORY_RETENTION: 11, // history in minutes of chart to keep.
  COLORS: {
    NAMED: {
      heater_bed: '#0095ff',
      extruder: '#ff0000',
      chamber: '#00ff00'
    }
  }
})

export const defaultPlotLayout = Object.freeze({
  showScale: true,
  plot_bgcolor: 'transparent',
  paper_bgcolor: 'transparent',
  margin: {
    l: 0,
    r: 100,
    b: 0,
    t: 0
  },
  scene: {
    camera: {
      eye: {
        x: -1.25,
        y: -1.25,
        z: 0.5
      }
    },
    xaxis: {
      color: '#999',
      range: [0, 200]
    },
    yaxis: {
      color: '#999',
      range: [0, 200]
    },
    zaxis: {
      color: '#999',
      range: [-1, 1]
    }
  }
})

/* eslint-enable @typescript-eslint/camelcase */
