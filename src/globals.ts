import { ChartConfiguration } from '@/types'

/**
 * Global, static constants.
 */
export const Globals = Object.freeze({
  CONSOLE_HISTORY_RETENTION: 1000,
  KLIPPY_RETRY_DELAY: 3000,
  LOCAL_STORAGE_KEY: 'appConfig',
  SETTINGS_FILENAME: '.fluidd.json'
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
  onZAdjust: 'onZAdjust',
  onRetract: 'onRetract',
  onExtrude: 'onExtrude',
  onMeshCalibrate: 'onMeshCalibrate'
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
