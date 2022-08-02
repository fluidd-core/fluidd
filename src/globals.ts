import {
  mdiClose,
  mdiTune,
  mdiMinus,
  mdiPlus,
  mdiCheck,
  mdiFire,
  mdiCog,
  mdiCarBrakeAlert,
  mdiPrinter3d,
  mdiPrinter3dNozzleOutline,
  mdiFileCodeOutline,
  mdiConsole,
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
  mdiArrowCollapseDown,
  mdiViewGridOutline,
  mdiArrowExpandHorizontal,
  mdiRefresh,
  mdiCheckCircleOutline,
  mdiCheckboxBlankCircleOutline,
  mdiPrinter3dNozzleAlertOutline,
  mdiAlertCircle,
  mdiFolderPlus,
  mdiFile,
  mdiFolder,
  mdiPencil,
  mdiMagnify,
  mdiDownload,
  mdiFormTextbox,
  mdiDelete,
  mdiCogs,
  mdiContentSaveOutline,
  mdiAlert,
  mdiDotsVertical,
  mdiSend,
  mdiArrowHorizontalLock,
  mdiChartTimelineVariant,
  mdiFireAlert,
  mdiSnowflakeAlert,
  mdiUpload,
  mdiFolderUpload,
  mdiProgressUpload,
  mdiRadioboxMarked,
  mdiCheckboxBlankOutline,
  mdiCheckboxMarkedOutline,
  mdiFilePlus,
  mdiBellOutline,
  mdiPower,
  mdiPowerCycle,
  mdiRestart,
  mdiRestartAlert,
  mdiUpdate,
  mdiChevronRight,
  mdiChevronLeft,
  mdiDrag,
  mdiCheckboxMultipleBlank,
  mdiOpenInApp,
  mdiDesktopTower,
  mdiDotsHorizontal,
  mdiToggleSwitch,
  mdiToggleSwitchOffOutline,
  mdiMotionOutline,
  mdiThermometerLow,
  mdiHelpCircle,
  mdiHistory,
  mdiFilterOutline,
  mdiSourceCommit,
  mdiArrowExpandUp,
  mdiCloudCheck,
  mdiCloudAlert,
  mdiCircle,
  mdiFolderMove,
  mdiConsoleLine,
  mdiDotsGrid,
  mdiHammerWrench,
  mdiAccount,
  mdiFileTableOutline,
  mdiLock,
  mdiLockOpenVariant,
  mdiPencilLock,
  mdiLockReset,
  mdiCubeScan,
  mdiHandBackRight,
  mdiThermometerAlert,
  mdiShieldAccount,
  mdiContentCopy,
  mdiApps,
  mdiAccountPlus,
  mdiViewDashboardOutline,
  mdiHome,
  mdiRestore,
  mdiMenu,
  mdiFileCancel,
  mdiCancel,
  mdiCircleSlice3,
  mdiCodeJson,
  mdiHarddisk,
  mdiLayersTripleOutline,
  mdiMessageTextOutline,
  mdiSwapVertical,
  mdiFullscreen,
  mdiStop,
  mdiPlay,
  mdiFileVideoOutline,
  mdiBellSleep,
  mdiChip,
  mdiViewHeadline,
  mdiAxisArrow,
  mdiVectorLine,
  mdiOpenInNew
} from '@mdi/js'

/**
 * Global, static constants.
 */
export const Globals = Object.freeze({
  APP_NAME: 'fluidd',
  HEADER_HEIGHT: 56,
  DEFAULTS: {
    CAMERA_URL: '/webcam?action=stream'
  },
  NETWORK_REQUEST_TIMEOUT: 0,
  KLIPPY_RETRY_DELAY: 1500,
  SOCKET_RETRY_DELAY: 2000,
  SOCKET_PING_INTERVAL: 10000,
  CONSOLE_HISTORY_RETENTION: 1000, // total count
  CONSOLE_RECEIVE_PREFIX: '',
  CONSOLE_SEND_PREFIX: '$ ',
  CONSOLE_COMMAND_HISTORY: 20,
  CHART_HISTORY_RETENTION: 1200,
  JOB_HISTORY_LOAD: 50,
  KLIPPY_DISCONNECTED_REDIRECT: '/configuration',
  LOCAL_CARDSTATE_STORAGE_KEY: 'cardState', // collapsed or not
  LOCAL_CARDLAYOUT_STORAGE_KEY: 'cardLayout2', // Specific layout / enabled / disabled
  LOCAL_INSTANCES_STORAGE_KEY: 'appInstances',
  MOONRAKER_DB: {
    NAMESPACE: 'fluidd',
    ROOTS: {
      uiSettings: { name: 'uiSettings', dispatch: 'config/initUiSettings' },
      macros: { name: 'macros', dispatch: 'macros/initMacros' },
      console: { name: 'console', dispatch: 'console/initConsole' },
      charts: { name: 'charts', dispatch: 'charts/initCharts' },
      cameras: { name: 'cameras', dispatch: 'cameras/initCameras' },
      layout: { name: 'layout', dispatch: 'layout/initLayout' }
    }
  },
  MOONRAKER_COMPONENTS: {
    auth: { name: 'authorization', dispatch: 'auth/init' },
    power: { name: 'power', dispatch: 'power/init' },
    updateManager: { name: 'update_manager', dispatch: 'version/init' },
    history: { name: 'history', dispatch: 'history/init' },
    timelapse: { name: 'timelapse', dispatch: 'timelapse/init' },
    announcements: { name: 'announcements', dispatch: 'announcements/init' }
  },
  // Ordered by weight.
  CONFIG_SERVICE_MAP: [
    { filename: 'moonraker.conf', service: 'moonraker', link: 'https://moonraker.readthedocs.io/en/latest/configuration/' },
    { filename: 'webcam.txt', service: 'webcamd' },
    { filename: 'crowsnest.conf', service: 'crowsnest', link: 'https://github.com/mainsail-crew/crowsnest' },
    { filename: 'klipperscreen.conf', service: 'KlipperScreen', link: 'https://klipperscreen.readthedocs.io/en/latest/' },
    { filename: 'mooncord-webcam.json', service: 'webcamd', link: 'https://github.com/eliteSchwein/mooncord' },
    { prefix: 'mooncord', service: 'MoonCord', link: 'https://github.com/eliteSchwein/mooncord' },
    { filename: 'telegram.conf', service: 'moonraker-telegram-bot', link: 'https://github.com/nlef/moonraker-telegram-bot/wiki/Sample-config' },
    { suffix: '.cfg', service: 'klipper', link: 'https://www.klipper3d.org/Config_Reference.html' }
  ],
  FILTERED_FILES_PREFIX: ['.thumbs', 'thumbs'],
  FILTERED_FILES_EXTENSION: ['.ignoreme'],
  DOCS_ROOT: 'https://docs.fluidd.xyz',
  DOCS_REQUIRED_CONFIGURATION: 'https://docs.fluidd.xyz/configuration/initial_setup',
  DOCS_MULTIPLE_INSTANCES: 'https://docs.fluidd.xyz/configuration/multiple_printers',
  DOCS_MOONRAKER_COMPONENTS: 'https://docs.fluidd.xyz/configuration/moonraker',
  DOCS_AUTH_LOST_PASSWORD: 'https://docs.fluidd.xyz/authorization#lost-password',
  DOCS_AUTH: 'https://docs.fluidd.xyz/authorization',
  GITHUB_REPO: 'https://github.com/fluidd-core/fluidd'
})

export const Icons = Object.freeze({
  dash: mdiViewDashboardOutline,
  account: mdiAccount,
  addAccount: mdiAccountPlus,
  help: mdiHelpCircle,
  motion: mdiMotionOutline,
  limits: mdiArrowHorizontalLock,
  send: mdiSend,
  open: mdiOpenInApp,
  move: mdiFolderMove,
  tabs: mdiCheckboxMultipleBlank,
  menu: mdiDotsVertical,
  menuAlt: mdiMenu,
  dots: mdiDotsHorizontal,
  dotsGrid: mdiDotsGrid,
  drag: mdiDrag,
  chart: mdiChartTimelineVariant,
  power: mdiPower,
  powerCycle: mdiPowerCycle,
  powerOn: mdiToggleSwitch,
  powerOff: mdiToggleSwitchOffOutline,
  home: mdiHome,
  close: mdiClose,
  refresh: mdiRefresh,
  restart: mdiRestart,
  restartAlert: mdiRestartAlert,
  update: mdiUpdate,
  warning: mdiAlert,
  error: mdiHandBackRight,
  thermometer: mdiThermometerLow,
  bell: mdiBellOutline,
  fireAlert: mdiFireAlert,
  snowflakeAlert: mdiSnowflakeAlert,
  circle: mdiCircle,
  blankCircle: mdiCheckboxBlankCircleOutline,
  markedCircle: mdiRadioboxMarked,
  checkedCircle: mdiCheckCircleOutline,
  checkboxBlank: mdiCheckboxBlankOutline,
  checkboxMarked: mdiCheckboxMarkedOutline,
  alertCircle: mdiAlertCircle,
  folderAdd: mdiFolderPlus,
  folderUp: mdiFolderUpload,
  folder: mdiFolder,
  fileUpload: mdiUpload,
  fileAdd: mdiFilePlus,
  inProgress: mdiCircleSlice3,
  progressUpload: mdiProgressUpload,
  up: mdiArrowUp,
  down: mdiArrowDown,
  left: mdiArrowLeft,
  right: mdiArrowRight,
  tune: mdiTune,
  zUp: mdiArrowExpandUp,
  zDown: mdiArrowCollapseDown,
  expandHorizontal: mdiArrowExpandHorizontal,
  cog: mdiCog,
  cogs: mdiCogs,
  save: mdiContentSaveOutline,
  estop: mdiCarBrakeAlert,
  fire: mdiFire,
  tools: mdiHammerWrench,
  minus: mdiMinus,
  plus: mdiPlus,
  check: mdiCheck,
  console: mdiConsole,
  clock: mdiClockOutline,
  formatLineSpacing: mdiFormatLineSpacing,
  layersTripleOutline: mdiLayersTripleOutline,
  chevronUp: mdiChevronUp,
  chevronDown: mdiChevronDown,
  chevronRight: mdiChevronRight,
  chevronLeft: mdiChevronLeft,
  timer: mdiTimerSand,
  fileCode: mdiFileCodeOutline,
  files: mdiFileTableOutline,
  fileDocument: mdiFileDocumentOutline,
  file: mdiFile,
  fileCancel: mdiFileCancel,
  pause: mdiPause,
  cancel: mdiWindowClose,
  cancelled: mdiCancel,
  play: mdiPlay,
  resume: mdiPlayBoxOutline,
  stop: mdiStop,
  reprint: mdiPrinter,
  printer: mdiPrinter,
  download: mdiDownload,
  rename: mdiFormTextbox,
  delete: mdiDelete,
  camera: mdiCamera,
  fan: mdiFan,
  pencil: mdiPencil,
  pencilLock: mdiPencilLock,
  magnify: mdiMagnify,
  printer3d: mdiPrinter3d,
  printer3dNozzle: mdiPrinter3dNozzleOutline,
  printer3dNozzleAlert: mdiPrinter3dNozzleAlertOutline,
  bedMesh: mdiViewGridOutline,
  host: mdiDesktopTower,
  history: mdiHistory,
  filter: mdiFilterOutline,
  commit: mdiSourceCommit,
  cloudCheck: mdiCloudCheck,
  cloudAlert: mdiCloudAlert,
  cubeScan: mdiCubeScan,
  consoleLine: mdiConsoleLine,
  lock: mdiLock,
  lockOpen: mdiLockOpenVariant,
  lockReset: mdiLockReset,
  reset: mdiRestore,
  tempError: mdiThermometerAlert,
  contentCopy: mdiContentCopy,
  apps: mdiApps,
  shieldAccount: mdiShieldAccount,
  retract: mdiSwapVertical,
  codeJson: mdiCodeJson,
  desktopTower: mdiDesktopTower,
  harddisk: mdiHarddisk,
  message: mdiMessageTextOutline,
  fullScreen: mdiFullscreen,
  video: mdiFileVideoOutline,
  snooze: mdiBellSleep,
  chip: mdiChip,
  viewHeadline: mdiViewHeadline,
  absolutePositioning: mdiAxisArrow,
  relativePositioning: mdiVectorLine,
  openInNew: mdiOpenInNew
})

export const Waits = Object.freeze({
  onServiceRestart: 'onServiceRestart',
  onServiceStop: 'onServiceStop',
  onServiceStart: 'onServiceStart',
  onDevicePowerToggle: 'onDevicePowerToggle',
  onHomeAll: 'onHomeAll',
  onHomeXY: 'onHomeXY',
  onHomeX: 'onHomeX',
  onHomeY: 'onHomeY',
  onHomeZ: 'onHomeZ',
  onQGL: 'onQGL',
  onZTilt: 'onZTilt',
  onBedScrewsAdjust: 'onBedScrewAdjust',
  onBedScrewsCalculate: 'onBedScrewsCalculate',
  onPrintPause: 'onPrintPause',
  onPrintCancel: 'onPrintCancel',
  onPrintResume: 'onPrintResume',
  onMacro: 'onMacro',
  onSetSpeed: 'onSetSpeed',
  onSetFlow: 'onSetFlow',
  onSetPressureAdvance: 'onSetPressureAdvance',
  onSetFanSpeed: 'onSetFanSpeed',
  onSetOutputPin: 'onSetOutputPin',
  onZAdjust: 'onZAdjust',
  onZApply: 'onZApply',
  onSaveConfig: 'onSaveConfig',
  onRetract: 'onRetract',
  onExtrude: 'onExtrude',
  onMeshCalibrate: 'onMeshCalibrate',
  onKlipperRestart: 'klipperRestart',
  onKlipperFirmwareRestart: 'klipperFirmwareRestart',
  onSetVelocity: 'onSetVelocity',
  onSetAcceleration: 'onSetAcceleration',
  onSetDeceleration: 'onSetDeceleration',
  onSetSCV: 'onSetSCV',
  onSetRetractLength: 'onSetRetractLength',
  onSetRetractSpeed: 'onSetRetractSpeed',
  onSetUnretractSpeed: 'onSetUnretractSpeed',
  onSetUnretractExtraLength: 'onSetUnretractExtraLength',
  onExtruderChange: 'onExtruderChange',
  onLoadLanguage: 'onLoadLanguage',
  onFileSystem: 'onFileSystem',
  onTimelapseSaveFrame: 'onTimelapseSaveFrame',
  onManualProbe: 'onManualProbe'
})
