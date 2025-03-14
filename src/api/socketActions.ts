import Vue from 'vue'
import { Globals, Waits } from '@/globals'
import type { NotifyOptions } from '@/plugins/socketClient'
import { consola } from 'consola'
import type { TimelapseWritableSettings } from '@/store/timelapse/types'
import type { WebcamConfig } from '@/store/webcams/types'

const baseEmit = (method: string, options: NotifyOptions) => {
  if (!Vue.$socket) {
    consola.warn('Socket emit denied, socket not ready.', method, options)
    return
  }
  Vue.$socket.emit(method, options)
}

export const SocketActions = {
  async machineServicesRestart (service: string, options?: NotifyOptions) {
    baseEmit(
      'machine.services.restart', {
        dispatch: 'void',
        wait: Waits.onServiceRestart,
        ...options,
        params: {
          service
        }
      }
    )
  },

  async machineServicesStart (service: string, options?: NotifyOptions) {
    baseEmit(
      'machine.services.start', {
        dispatch: 'void',
        wait: Waits.onServiceStart,
        ...options,
        params: {
          service
        },
      }
    )
  },

  async machineServicesStop (service: string, options?: NotifyOptions) {
    baseEmit(
      'machine.services.stop', {
        dispatch: 'void',
        wait: Waits.onServiceStop,
        ...options,
        params: {
          service
        }
      }
    )
  },

  async machineReboot (options?: NotifyOptions) {
    baseEmit(
      'machine.reboot', {
        dispatch: 'void',
        ...options
      }
    )
  },

  async machineShutdown (options?: NotifyOptions) {
    baseEmit(
      'machine.shutdown', {
        dispatch: 'void',
        ...options
      }
    )
  },

  async machineUpdateStatus (refresh = false, options?: NotifyOptions) {
    baseEmit(
      'machine.update.status', {
        dispatch: 'version/onUpdateStatus',
        wait: Waits.onVersionRefresh,
        ...options,
        params: {
          refresh
        }
      }
    )
  },

  async machineUpdateRefresh (name?: string, options?: NotifyOptions) {
    baseEmit(
      'machine.update.refresh', {
        dispatch: 'version/onUpdateStatus',
        wait: Waits.onVersionRefresh,
        ...options,
        params: {
          name
        }
      }
    )
  },

  async machineUpdateRecover (name: string, hard = false, options?: NotifyOptions) {
    const dispatch = name === 'moonraker'
      ? 'version/onUpdatedMoonraker'
      : name === 'klipper'
        ? 'version/onUpdatedKlipper'
        : 'version/onUpdatedClient'

    baseEmit(
      'machine.update.recover', {
        dispatch,
        ...options,
        params: {
          name,
          hard
        }
      }
    )
  },

  async machineUpdateMoonraker (options?: NotifyOptions) {
    baseEmit(
      'machine.update.moonraker', {
        dispatch: 'version/onUpdatedMoonraker',
        ...options
      }
    )
  },

  async machineUpdateKlipper (options?: NotifyOptions) {
    baseEmit(
      'machine.update.klipper', {
        dispatch: 'version/onUpdatedKlipper',
        ...options,
        params: {
          include_deps: true
        }
      }
    )
  },

  async machineUpdateClient (name: string, options?: NotifyOptions) {
    const dispatch = name === 'fluidd'
      ? 'version/onUpdatedFluidd'
      : 'version/onUpdatedClient'

    baseEmit(
      'machine.update.client', {
        dispatch,
        ...options,
        params: {
          name
        }
      }
    )
  },

  async machineUpdateSystem (options?: NotifyOptions) {
    baseEmit(
      'machine.update.system', {
        dispatch: 'version/onUpdatedSystem',
        ...options
      }
    )
  },

  async machineUpdateAll (options?: NotifyOptions) {
    baseEmit(
      'machine.update.full', {
        dispatch: 'version/onUpdatedAll',
        ...options
      }
    )
  },

  async machineProcStats (options?: NotifyOptions) {
    baseEmit(
      'machine.proc_stats', {
        dispatch: 'server/onMachineProcStats',
        ...options
      }
    )
  },

  async machineSystemInfo (options?: NotifyOptions) {
    baseEmit(
      'machine.system_info', {
        dispatch: 'server/onMachineSystemInfo',
        ...options
      }
    )
  },

  async machineDevicePowerDevices (options?: NotifyOptions) {
    baseEmit(
      'machine.device_power.devices', {
        dispatch: 'power/onInit',
        ...options
      }
    )
  },

  async machineDevicePowerStatus (device: string, options?: NotifyOptions) {
    baseEmit(
      'machine.device_power.status', {
        dispatch: 'power/onStatus',
        ...options,
        params: {
          [device]: null
        }
      }
    )
  },

  async machineDevicePowerSetDevice (device: string, action: 'on' | 'off' | 'toggle', options?: NotifyOptions) {
    baseEmit(
      'machine.device_power.post_device', {
        dispatch: 'power/onStatus',
        wait: `${Waits.onDevicePowerToggle}/${device}`,
        ...options,
        params: {
          device,
          action
        }
      }
    )
  },

  async machinePeripheralsUsb (options?: NotifyOptions) {
    baseEmit(
      'machine.peripherals.usb', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsUsb,
        ...options
      }
    )
  },

  async machinePeripheralsSerial (options?: NotifyOptions) {
    baseEmit(
      'machine.peripherals.serial', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsSerial,
        ...options
      }
    )
  },

  async machinePeripheralsVideo (options?: NotifyOptions) {
    baseEmit(
      'machine.peripherals.video', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsVideo,
        ...options
      }
    )
  },

  async machinePeripheralsCanbus (canbusInterface: string, options?: NotifyOptions) {
    baseEmit(
      'machine.peripherals.canbus', {
        dispatch: 'server/onMachinePeripheralsCanbus',
        wait: `${Waits.onMachinePeripheralsCanbus}/${canbusInterface}`,
        ...options,
        params: {
          interface: canbusInterface
        }
      }
    )
  },

  async machineTimelapseSetSettings (settings: Partial<TimelapseWritableSettings>, options?: NotifyOptions) {
    baseEmit(
      'machine.timelapse.post_settings', {
        dispatch: 'timelapse/onSettings',
        ...options,
        params: settings
      }
    )
  },

  async machineTimelapseSaveFrames (options?: NotifyOptions) {
    baseEmit(
      'machine.timelapse.saveframes', {
        wait: Waits.onTimelapseSaveFrame,
        ...options
      }
    )
  },

  async machineTimelapseRender (options?: NotifyOptions) {
    baseEmit('machine.timelapse.render', {
      ...options
    })
  },

  async machineTimelapseGetSettings (options?: NotifyOptions) {
    baseEmit(
      'machine.timelapse.get_settings', {
        dispatch: 'timelapse/onSettings',
        ...options
      }
    )
  },

  async machineTimelapseLastFrameInfo (options?: NotifyOptions) {
    baseEmit(
      'machine.timelapse.lastframeinfo', {
        dispatch: 'timelapse/onLastFrame',
        ...options
      }
    )
  },

  async printerInfo (options?: NotifyOptions) {
    baseEmit(
      'printer.info', {
        dispatch: 'printer/onPrinterInfo',
        ...options
      }
    )
  },

  async printerRestart (options?: NotifyOptions) {
    baseEmit(
      'printer.restart', {
        dispatch: 'void',
        wait: Waits.onKlipperRestart,
        ...options
      }
    )
  },

  async printerFirmwareRestart (options?: NotifyOptions) {
    baseEmit(
      'printer.firmware_restart', {
        dispatch: 'void',
        wait: Waits.onKlipperFirmwareRestart,
        ...options
      }
    )
  },

  async printerQueryEndstops (options?: NotifyOptions) {
    baseEmit(
      'printer.query_endstops.status', {
        dispatch: 'printer/onQueryEndstops',
        wait: Waits.onQueryEndstops,
        ...options
      }
    )
  },

  async printerObjectsList (options?: NotifyOptions) {
    baseEmit(
      'printer.objects.list', {
        dispatch: 'printer/onPrinterObjectsList',
        ...options
      }
    )
  },

  async printerObjectsSubscribe (objects: Record<string, null>, options?: NotifyOptions) {
    baseEmit(
      'printer.objects.subscribe', {
        dispatch: 'printer/onPrinterObjectsSubscribe',
        ...options,
        params: {
          objects
        }
      }
    )
  },

  async printerPrintStart (path: string, options?: NotifyOptions) {
    baseEmit(
      'printer.print.start', {
        dispatch: 'void',
        ...options,
        params: {
          filename: path
        }
      }
    )
  },

  async printerPrintCancel (options?: NotifyOptions) {
    baseEmit(
      'printer.print.cancel', {
        dispatch: 'printer/onPrintCancel',
        wait: Waits.onPrintCancel,
        ...options
      }
    )
  },

  async printerPrintPause (options?: NotifyOptions) {
    baseEmit(
      'printer.print.pause', {
        dispatch: 'printer/onPrintPause',
        wait: Waits.onPrintPause,
        ...options
      }
    )
  },

  async printerPrintResume (options?: NotifyOptions) {
    baseEmit(
      'printer.print.resume', {
        dispatch: 'printer/onPrintResume',
        wait: Waits.onPrintResume,
        ...options
      }
    )
  },

  async printerGcodeScript (gcode: string, options?: NotifyOptions) {
    baseEmit(
      'printer.gcode.script', {
        dispatch: 'console/onGcodeScript',
        ...options,
        params: {
          script: gcode
        }
      }
    )
  },

  async printerGcodeHelp (options?: NotifyOptions) {
    baseEmit(
      'printer.gcode.help', {
        dispatch: 'console/onGcodeHelp',
        ...options
      }
    )
  },

  async printerEmergencyStop (options?: NotifyOptions) {
    baseEmit(
      'printer.emergency_stop', {
        dispatch: 'void',
        ...options
      }
    )
  },

  async serverInfo (options?: NotifyOptions) {
    baseEmit(
      'server.info', {
        dispatch: 'server/onServerInfo',
        ...options
      }
    )
  },

  async serverConnectionIdentify (params?: { client_name: string, version: string, type: string, url: string }, options?: NotifyOptions) {
    baseEmit('server.connection.identify', {
      dispatch: 'socket/onConnectionId',
      ...options,
      params
    })
  },

  async serverConfig (options?: NotifyOptions) {
    baseEmit(
      'server.config', {
        dispatch: 'server/onServerConfig',
        ...options
      }
    )
  },

  async serverWrite (key: string, value: unknown, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    baseEmit(
      'server.database.post_item', {
        ...options,
        params: {
          namespace,
          key,
          value
        }
      }
    )
  },

  async serverDelete (key: string, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    baseEmit(
      'server.database.delete_item', {
        ...options,
        params: {
          namespace,
          key
        }
      }
    )
  },

  async serverRead (key?: string, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    baseEmit(
      'server.database.get_item', {
        dispatch: 'socket/onServerRead',
        ...options,
        params: {
          namespace,
          key
        }
      }
    )
  },

  async serverRestart (options?: NotifyOptions) {
    baseEmit(
      'server.restart', {
        dispatch: 'void',
        ...options
      }
    )
  },

  async serverTemperatureStore (options?: NotifyOptions) {
    baseEmit(
      'server.temperature_store', {
        dispatch: 'charts/initTempStore',
        ...options,
        params: {
          include_monitors: true
        }
      }
    )
  },

  async serverGcodeStore (options?: NotifyOptions) {
    baseEmit(
      'server.gcode_store', {
        dispatch: 'console/onGcodeStore',
        ...options
      }
    )
  },

  async serverHistoryList (params?: { start?: number; limit?: number; before?: number; since?: number; order?: string }, options?: NotifyOptions) {
    baseEmit(
      'server.history.list', {
        dispatch: 'history/onHistoryList',
        ...options,
        params
      }
    )
  },

  async serverHistoryTotals (options?: NotifyOptions) {
    baseEmit(
      'server.history.totals', {
        dispatch: 'history/onHistoryTotals',
        ...options
      }
    )
  },

  async serverHistoryDeleteJob (uid: string, options?: NotifyOptions) {
    const params = uid === 'all'
      ? { all: true }
      : { uid }

    baseEmit(
      'server.history.delete_job', {
        dispatch: 'history/onDelete',
        ...options,
        params
      }
    )
  },

  async serverHistoryResetTotals (options?: NotifyOptions) {
    baseEmit(
      'server.history.reset_totals', {
        dispatch: 'history/onHistoryChange',
        ...options
      }
    )
  },

  async serverJobQueueStatus (options?: NotifyOptions) {
    baseEmit(
      'server.job_queue.status', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options
      }
    )
  },

  async serverJobQueuePostJob (filenames: string[], reset?: boolean, options?: NotifyOptions) {
    baseEmit(
      'server.job_queue.post_job', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options,
        params: {
          filenames,
          reset
        }
      }
    )
  },

  async serverJobQueueDeleteJobs (jobIds: string[], options?: NotifyOptions) {
    const params = jobIds.length > 0 && jobIds[0] === 'all'
      ? { all: true }
      : { job_ids: jobIds }

    baseEmit(
      'server.job_queue.delete_job', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options,
        params
      }
    )
  },

  async serverJobQueuePause (options?: NotifyOptions) {
    baseEmit(
      'server.job_queue.pause', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options
      }
    )
  },

  async serverJobQueueStart (options?: NotifyOptions) {
    baseEmit(
      'server.job_queue.start', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options
      }
    )
  },

  /**
   * Loads the metadata for a given filepath.
   * Expects the full path including root.
   * Optionally pass the just the filename and path.
   */
  async serverFilesMetadata (filename: string, options?: NotifyOptions) {
    baseEmit(
      'server.files.metadata', {
        dispatch: 'files/onFileMetaData',
        wait: `${Waits.onFileSystem}/gcodes/${filename}`,
        ...options,
        params: {
          filename
        }
      }
    )
  },

  async serverFilesMetascan (filename: string, options?: NotifyOptions) {
    baseEmit(
      'server.files.metascan', {
        dispatch: 'files/onFileMetaData',
        wait: `${Waits.onFileSystem}/gcodes/${filename}`,
        ...options,
        params: {
          filename
        }
      }
    )
  },

  /**
   * This only requires path, but we pass root along too
   * for brevity.
   */
  async serverFilesGetDirectory (path: string, options?: NotifyOptions) {
    baseEmit(
      'server.files.get_directory',
      {
        dispatch: 'files/onServerFilesGetDirectory',
        wait: `${Waits.onFileSystem}/${path}/`,
        ...options,
        params: {
          path,
          extended: true
        }
      }
    )
  },

  async serverFilesListRoot (root: string, options?: NotifyOptions) {
    baseEmit(
      'server.files.list',
      {
        dispatch: 'files/onServerFilesListRoot',
        wait: `${Waits.onFileSystem}/${root}/`,
        ...options,
        params: {
          root
        }
      }
    )
  },

  async serverFilesMove (source: string, dest: string, options?: NotifyOptions) {
    baseEmit(
      'server.files.move', {
        dispatch: 'void',
        wait: `${Waits.onFileSystem}/${source}/`,
        ...options,
        params: {
          source,
          dest
        }
      }
    )
  },

  async serverFilesCopy (source: string, dest: string, options?: NotifyOptions) {
    baseEmit(
      'server.files.copy', {
        dispatch: 'void',
        wait: `${Waits.onFileSystem}/${source}/`,
        ...options,
        params: {
          source,
          dest
        }
      }
    )
  },

  async serverFilesZip (dest: string, items: string[], store_only?: boolean, options?: NotifyOptions) {
    baseEmit(
      'server.files.zip', {
        dispatch: 'void',
        wait: `${Waits.onFileSystem}/${dest}/`,
        ...options,
        params: {
          dest,
          items,
          store_only
        }
      }
    )
  },

  /**
   * Create a directory.
   * Root should be included in the path.
   */
  async serverFilesPostDirectory (path: string, options?: NotifyOptions) {
    baseEmit(
      'server.files.post_directory', {
        dispatch: 'void',
        wait: `${Waits.onFileSystem}/${path}/`,
        ...options,
        params: {
          path
        }
      }
    )
  },

  async serverFilesDeleteFile (path: string, options?: NotifyOptions) {
    baseEmit(
      'server.files.delete_file', {
        dispatch: 'void',
        wait: `${Waits.onFileSystem}/${path}`,
        ...options,
        params: {
          path
        }
      }
    )
  },

  async serverFilesDeleteDirectory (path: string, force = false, options?: NotifyOptions) {
    baseEmit(
      'server.files.delete_directory', {
        dispatch: 'void',
        wait: `${Waits.onFileSystem}/${path}/`,
        ...options,
        params: {
          path,
          force
        }
      }
    )
  },

  async serverAnnouncementsList (options?: NotifyOptions) {
    baseEmit(
      'server.announcements.list', {
        dispatch: 'announcements/onAnnouncementsList',
        ...options
      }
    )
  },

  async serverAnnouncementsDismiss (entry_id: string, wake_time?: number, options?: NotifyOptions) {
    baseEmit(
      'server.announcements.dismiss', {
        dispatch: 'void',
        ...options,
        params: {
          entry_id,
          wake_time
        }
      }
    )
  },

  async serverLogsRollover (application?: string, options?: NotifyOptions) {
    baseEmit(
      'server.logs.rollover', {
        dispatch: 'server/onLogsRollOver',
        ...options,
        params: {
          application
        }
      }
    )
  },

  async serverWebcamsList (options?: NotifyOptions) {
    baseEmit(
      'server.webcams.list', {
        dispatch: 'webcams/onWebcamsList',
        ...options
      }
    )
  },

  async serverWebcamsWrite (webcam: WebcamConfig, options?: NotifyOptions) {
    baseEmit(
      'server.webcams.post_item', {
        ...options,
        params: webcam
      }
    )
  },

  async serverWebcamsDelete (uid: string, options?: NotifyOptions) {
    baseEmit(
      'server.webcams.delete_item', {
        ...options,
        params: {
          uid
        }
      }
    )
  },

  async serverSensorsList (options?: NotifyOptions) {
    baseEmit(
      'server.sensors.list', {
        dispatch: 'sensors/onSensorsList',
        ...options,
        params: {
          extended: true
        }
      }
    )
  },

  async serverAnalysisStatus (options?: NotifyOptions) {
    baseEmit(
      'server.analysis.status', {
        dispatch: 'analysis/onAnalysisStatus',
        ...options
      }
    )
  },

  async serverAnalysisEstimate (filename: string, estimator_config?: string, options?: NotifyOptions) {
    baseEmit(
      'server.analysis.estimate', {
        wait: `${Waits.onFileSystem}/gcodes/${filename}`,
        dispatch: 'void',
        ...options,
        params: {
          filename,
          estimator_config
        }
      }
    )
  },

  async serverAnalysisProcess (filename: string, estimator_config?: string, force?: boolean, options?: NotifyOptions) {
    baseEmit(
      'server.analysis.process', {
        wait: `${Waits.onFileSystem}/gcodes/${filename}`,
        dispatch: 'analysis/onAnalysisProcess',
        ...options,
        params: {
          filename,
          estimator_config,
          force
        }
      }
    )
  },

  async serverSpoolmanGetSpoolId (options?: NotifyOptions) {
    baseEmit(
      'server.spoolman.get_spool_id', {
        dispatch: 'spoolman/onActiveSpool',
        ...options
      }
    )
  },

  async serverSpoolmanPostSpoolId (spoolId: number | undefined, options?: NotifyOptions) {
    baseEmit(
      'server.spoolman.post_spool_id', {
        dispatch: 'spoolman/onActiveSpool',
        ...options,
        params: {
          spool_id: spoolId
        }
      }
    )
  },

  async serverSpoolmanProxyGetAvailableSpools (options?: NotifyOptions) {
    baseEmit(
      'server.spoolman.proxy', {
        dispatch: 'spoolman/onAvailableSpools',
        ...options,
        params: {
          request_method: 'GET',
          path: '/v1/spool',
          use_v2_response: true
        }
      }
    )
  },

  async serverSpoolmanProxyGetInfo (options?: NotifyOptions) {
    baseEmit(
      'server.spoolman.proxy', {
        dispatch: 'spoolman/onInfo',
        ...options,
        params: {
          request_method: 'GET',
          path: '/v1/info',
          use_v2_response: true
        }
      }
    )
  },

  async serverSpoolmanProxyGetSettingCurrency (options?: NotifyOptions) {
    baseEmit(
      'server.spoolman.proxy', {
        dispatch: 'spoolman/onSettingCurrency',
        ...options,
        params: {
          request_method: 'GET',
          path: '/v1/setting/currency',
          use_v2_response: true
        }
      }
    )
  }
}
