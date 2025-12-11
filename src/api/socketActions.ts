import Vue from 'vue'
import { Globals, Waits } from '@/globals'
import type { NotifyOptions } from '@/plugins/socketClient'
import { consola } from 'consola'
import type { TimelapseWritableSettings } from '@/store/timelapse/types'
import type { WebcamConfig } from '@/store/webcams/types'

const baseEmit = async <T = unknown>(method: string, options: NotifyOptions): Promise<T> => {
  if (!Vue.$socket) {
    consola.warn('Socket emit denied, socket not ready.', method, options)

    throw new Error('Socket not ready')
  } else {
    const result = await Vue.$socket.emit(method, options)

    return result as T
  }
}

export const SocketActions = {
  machineServicesRestart (service: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
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

  machineServicesStart (service: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
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

  machineServicesStop (service: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
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

  machineReboot (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'machine.reboot', {
        dispatch: 'void',
        ...options
      }
    )
  },

  machineShutdown (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'machine.shutdown', {
        dispatch: 'void',
        ...options
      }
    )
  },

  machineUpdateStatus (refresh = false, options?: NotifyOptions) {
    return baseEmit(
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

  machineUpdateRefresh (name?: string, options?: NotifyOptions) {
    return baseEmit(
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

  machineUpdateRecover (name: string, hard = false, options?: NotifyOptions) {
    const dispatch = name === 'moonraker'
      ? 'version/onUpdatedMoonraker'
      : name === 'klipper'
        ? 'version/onUpdatedKlipper'
        : 'version/onUpdatedClient'

    return baseEmit<Moonraker.OkResponse>(
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

  machineUpdateMoonraker (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'machine.update.moonraker', {
        dispatch: 'version/onUpdatedMoonraker',
        ...options
      }
    )
  },

  machineUpdateKlipper (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'machine.update.klipper', {
        dispatch: 'version/onUpdatedKlipper',
        ...options,
        params: {
          include_deps: true
        }
      }
    )
  },

  machineUpdateClient (name: string, options?: NotifyOptions) {
    const dispatch = name === 'fluidd'
      ? 'version/onUpdatedFluidd'
      : 'version/onUpdatedClient'

    return baseEmit<Moonraker.OkResponse>(
      'machine.update.client', {
        dispatch,
        ...options,
        params: {
          name
        }
      }
    )
  },

  machineUpdateSystem (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'machine.update.system', {
        dispatch: 'version/onUpdatedSystem',
        ...options
      }
    )
  },

  machineUpdateAll (options?: NotifyOptions) {
    baseEmit<Moonraker.OkResponse>(
      'machine.update.full', {
        dispatch: 'version/onUpdatedAll',
        ...options
      }
    )
  },

  machineProcStats (options?: NotifyOptions) {
    return baseEmit(
      'machine.proc_stats', {
        dispatch: 'server/onMachineProcStats',
        ...options
      }
    )
  },

  machineSystemInfo (options?: NotifyOptions) {
    return baseEmit(
      'machine.system_info', {
        dispatch: 'server/onMachineSystemInfo',
        ...options
      }
    )
  },

  machineDevicePowerDevices (options?: NotifyOptions) {
    return baseEmit<Moonraker.Power.DevicesResponse>(
      'machine.device_power.devices', {
        dispatch: 'power/onInit',
        ...options
      }
    )
  },

  machineDevicePowerStatus (device: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Power.StatusResponse>(
      'machine.device_power.status', {
        dispatch: 'power/onStatus',
        ...options,
        params: {
          [device]: null
        }
      }
    )
  },

  machineDevicePowerSetDevice (device: string, action: 'on' | 'off' | 'toggle', options?: NotifyOptions) {
    return baseEmit<Moonraker.Power.StatusResponse>(
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

  machinePeripheralsUsb (options?: NotifyOptions) {
    return baseEmit<Moonraker.Peripherals.UsbResponse>(
      'machine.peripherals.usb', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsUsb,
        ...options
      }
    )
  },

  machinePeripheralsSerial (options?: NotifyOptions) {
    return baseEmit<Moonraker.Peripherals.SerialResponse>(
      'machine.peripherals.serial', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsSerial,
        ...options
      }
    )
  },

  machinePeripheralsVideo (options?: NotifyOptions) {
    return baseEmit<Moonraker.Peripherals.VideoResponse>(
      'machine.peripherals.video', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsVideo,
        ...options
      }
    )
  },

  machinePeripheralsCanbus (canbusInterface: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Peripherals.CanbusResponse>(
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

  machineTimelapseSetSettings (settings: Partial<TimelapseWritableSettings>, options?: NotifyOptions) {
    return baseEmit(
      'machine.timelapse.post_settings', {
        dispatch: 'timelapse/onSettings',
        ...options,
        params: settings
      }
    )
  },

  machineTimelapseSaveFrames (options?: NotifyOptions) {
    return baseEmit(
      'machine.timelapse.saveframes', {
        wait: Waits.onTimelapseSaveFrame,
        ...options
      }
    )
  },

  machineTimelapseRender (options?: NotifyOptions) {
    return baseEmit(
      'machine.timelapse.render', {
        ...options
      }
    )
  },

  machineTimelapseGetSettings (options?: NotifyOptions) {
    return baseEmit(
      'machine.timelapse.get_settings', {
        dispatch: 'timelapse/onSettings',
        ...options
      }
    )
  },

  machineTimelapseLastFrameInfo (options?: NotifyOptions) {
    return baseEmit(
      'machine.timelapse.lastframeinfo', {
        dispatch: 'timelapse/onLastFrame',
        ...options
      }
    )
  },

  printerInfo (options?: NotifyOptions) {
    return baseEmit<Moonraker.Printer.Info>(
      'printer.info', {
        dispatch: 'printer/onPrinterInfo',
        ...options
      }
    )
  },

  printerRestart (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'printer.restart', {
        dispatch: 'void',
        wait: Waits.onKlipperRestart,
        ...options
      }
    )
  },

  printerFirmwareRestart (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'printer.firmware_restart', {
        dispatch: 'void',
        wait: Waits.onKlipperFirmwareRestart,
        ...options
      }
    )
  },

  printerQueryEndstops (options?: NotifyOptions) {
    return baseEmit<Moonraker.Printer.QueryEndstopsStatusResponse>(
      'printer.query_endstops.status', {
        dispatch: 'printer/onQueryEndstops',
        wait: Waits.onQueryEndstops,
        ...options
      }
    )
  },

  printerObjectsList (options?: NotifyOptions) {
    return baseEmit<Moonraker.Printer.ObjectsListResponse>(
      'printer.objects.list', {
        dispatch: 'printer/onPrinterObjectsList',
        ...options
      }
    )
  },

  printerObjectsSubscribe (objects: Record<string, null>, options?: NotifyOptions) {
    return baseEmit(
      'printer.objects.subscribe', {
        dispatch: 'printer/onPrinterObjectsSubscribe',
        ...options,
        params: {
          objects
        }
      }
    )
  },

  printerPrintStart (path: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'printer.print.start', {
        dispatch: 'void',
        ...options,
        params: {
          filename: path
        }
      }
    )
  },

  printerPrintCancel (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'printer.print.cancel', {
        dispatch: 'printer/onPrintCancel',
        wait: Waits.onPrintCancel,
        ...options
      }
    )
  },

  printerPrintPause (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'printer.print.pause', {
        dispatch: 'printer/onPrintPause',
        wait: Waits.onPrintPause,
        ...options
      }
    )
  },

  printerPrintResume (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'printer.print.resume', {
        dispatch: 'printer/onPrintResume',
        wait: Waits.onPrintResume,
        ...options
      }
    )
  },

  printerGcodeScript (gcode: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'printer.gcode.script', {
        dispatch: 'console/onGcodeScript',
        ...options,
        params: {
          script: gcode
        }
      }
    )
  },

  printerGcodeHelp (options?: NotifyOptions) {
    return baseEmit<Moonraker.Printer.GcodeHelpResponse>(
      'printer.gcode.help', {
        dispatch: 'console/onGcodeHelp',
        ...options
      }
    )
  },

  printerEmergencyStop (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'printer.emergency_stop', {
        dispatch: 'void',
        ...options
      }
    )
  },

  serverInfo (options?: NotifyOptions) {
    return baseEmit<Moonraker.Server.InfoResponse>(
      'server.info', {
        dispatch: 'server/onServerInfo',
        ...options
      }
    )
  },

  serverConnectionIdentify (params?: { client_name: string, version: string, type: string, url: string }, options?: NotifyOptions) {
    return baseEmit<Moonraker.Server.ConnectionIdentifyResponse>(
      'server.connection.identify', {
        dispatch: 'socket/onConnectionId',
        ...options,
        params
      })
  },

  serverConfig (options?: NotifyOptions) {
    return baseEmit<Moonraker.Server.ConfigResponse>(
      'server.config', {
        dispatch: 'server/onServerConfig',
        ...options
      }
    )
  },

  serverDatabaseList (options?: NotifyOptions) {
    return baseEmit<Moonraker.Database.ListResponse>(
      'server.database.list', {
        dispatch: 'database/onServerDatabaseList',
        wait: Waits.onDatabaseList,
        ...options
      }
    )
  },

  serverDatabaseCompact (options?: NotifyOptions) {
    return baseEmit<Moonraker.Database.CompactResponse>(
      'server.database.compact', {
        wait: Waits.onDatabaseCompact,
        ...options
      }
    )
  },

  serverDatabasePostBackup (filename: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Database.PostBackupResponse>(
      'server.database.post_backup', {
        dispatch: 'database/onServerDatabasePostBackup',
        wait: `${Waits.onDatabasePostBackup}/${filename}`,
        ...options,
        params: {
          filename
        }
      }
    )
  },

  serverDatabaseRestore (filename: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Database.RestoreResponse>(
      'server.database.restore', {
        wait: `${Waits.onDatabaseRestore}/${filename}`,
        ...options,
        params: {
          filename
        }
      }
    )
  },

  serverDatabaseDeleteBackup (filename: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Database.DeleteBackupResponse>(
      'server.database.delete_backup', {
        dispatch: 'database/onServerDatabaseDeleteBackup',
        wait: `${Waits.onDatabaseDeleteBackup}/${filename}`,
        ...options,
        params: {
          filename
        }
      }
    )
  },

  serverDatabasePostItem<T = unknown> (key: string, value: T, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    return baseEmit<Moonraker.Database.PostItemResponse<T>>(
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

  serverDatabaseDeleteItem<T = unknown> (key: string, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    return baseEmit<Moonraker.Database.DeleteItemResponse<T>>(
      'server.database.delete_item', {
        ...options,
        params: {
          namespace,
          key
        }
      }
    )
  },

  serverDatabaseGetItem<T = unknown> (key?: string, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    return baseEmit<Moonraker.Database.GetItemResponse<T>>(
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

  serverRestart (options?: NotifyOptions) {
    return baseEmit<Moonraker.OkResponse>(
      'server.restart', {
        dispatch: 'void',
        ...options
      }
    )
  },

  serverTemperatureStore (options?: NotifyOptions) {
    return baseEmit<Moonraker.Server.TemperatureStoreResponse>(
      'server.temperature_store', {
        dispatch: 'charts/initTempStore',
        ...options,
        params: {
          include_monitors: true
        }
      }
    )
  },

  serverGcodeStore (options?: NotifyOptions) {
    return baseEmit<Moonraker.Server.GcodeStoreResponse>(
      'server.gcode_store', {
        dispatch: 'console/onGcodeStore',
        ...options
      }
    )
  },

  serverHistoryList (params?: { start?: number; limit?: number; before?: number; since?: number; order?: string }, options?: NotifyOptions) {
    return baseEmit<Moonraker.History.ListResponse>(
      'server.history.list', {
        dispatch: 'history/onHistoryList',
        ...options,
        params
      }
    )
  },

  serverHistoryTotals (options?: NotifyOptions) {
    return baseEmit<Moonraker.History.TotalsResponse>(
      'server.history.totals', {
        dispatch: 'history/onHistoryTotals',
        ...options
      }
    )
  },

  serverHistoryDeleteJob (uid: string, options?: NotifyOptions) {
    const params = uid === 'all'
      ? { all: true }
      : { uid }

    return baseEmit<Moonraker.History.DeleteJobResponse>(
      'server.history.delete_job', {
        dispatch: 'history/onDelete',
        ...options,
        params
      }
    )
  },

  serverHistoryResetTotals (options?: NotifyOptions) {
    return baseEmit<Moonraker.History.TotalsResponse>(
      'server.history.reset_totals', {
        dispatch: 'history/onHistoryTotals',
        ...options
      }
    )
  },

  serverJobQueueStatus (options?: NotifyOptions) {
    return baseEmit<Moonraker.JobQueue.StatusResponse>(
      'server.job_queue.status', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options
      }
    )
  },

  serverJobQueuePostJob (filenames: string[], reset?: boolean, options?: NotifyOptions) {
    return baseEmit<Moonraker.JobQueue.StatusResponse>(
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

  serverJobQueueDeleteJobs (jobIds: string[], options?: NotifyOptions) {
    const params = jobIds.length > 0 && jobIds[0] === 'all'
      ? { all: true }
      : { job_ids: jobIds }

    return baseEmit<Moonraker.JobQueue.StatusResponse>(
      'server.job_queue.delete_job', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options,
        params
      }
    )
  },

  serverJobQueuePause (options?: NotifyOptions) {
    return baseEmit<Moonraker.JobQueue.StatusResponse>(
      'server.job_queue.pause', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options
      }
    )
  },

  serverJobQueueStart (options?: NotifyOptions) {
    return baseEmit<Moonraker.JobQueue.StatusResponse>(
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
  serverFilesMetadata (filename: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.FileWithMetaResponse>(
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

  serverFilesMetascan (filename: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.FileWithMetaResponse>(
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
  serverFilesGetDirectory (path: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.GetDirectoryResponse>(
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

  serverFilesList (root: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.ListRootResponse>(
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

  serverFilesMove (source: string, dest: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.ChangeResponse>(
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

  serverFilesCopy (source: string, dest: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.ChangeResponse>(
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

  serverFilesZip (dest: string, items: string[], store_only?: boolean, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.ZipResponse>(
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
  serverFilesPostDirectory (path: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.ChangeResponse>(
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

  serverFilesDeleteFile (path: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.ChangeResponse>(
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

  serverFilesDeleteDirectory (path: string, force = false, options?: NotifyOptions) {
    return baseEmit<Moonraker.Files.ChangeResponse>(
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

  serverAnnouncementsList (options?: NotifyOptions) {
    return baseEmit<Moonraker.Announcements.ListResponse>(
      'server.announcements.list', {
        dispatch: 'announcements/onAnnouncementsList',
        ...options
      }
    )
  },

  serverAnnouncementsDismiss (entry_id: string, wake_time?: number, options?: NotifyOptions) {
    return baseEmit<Moonraker.Announcements.DismissResponse>(
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

  serverLogsRollover (application?: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Server.LogsRolloverResponse>(
      'server.logs.rollover', {
        dispatch: 'server/onLogsRollOver',
        ...options,
        params: {
          application
        }
      }
    )
  },

  serverWebcamsList (options?: NotifyOptions) {
    return baseEmit(
      'server.webcams.list', {
        dispatch: 'webcams/onWebcamsList',
        ...options
      }
    )
  },

  serverWebcamsWrite (webcam: WebcamConfig, options?: NotifyOptions) {
    return baseEmit(
      'server.webcams.post_item', {
        ...options,
        params: webcam
      }
    )
  },

  serverWebcamsDelete (uid: string, options?: NotifyOptions) {
    return baseEmit(
      'server.webcams.delete_item', {
        ...options,
        params: {
          uid
        }
      }
    )
  },

  serverSensorsList (options?: NotifyOptions) {
    return baseEmit<Moonraker.Sensor.ListResponse>(
      'server.sensors.list', {
        dispatch: 'sensors/onSensorsList',
        ...options,
        params: {
          extended: true
        }
      }
    )
  },

  serverAnalysisStatus (options?: NotifyOptions) {
    return baseEmit<Moonraker.Analysis.StatusResponse>(
      'server.analysis.status', {
        dispatch: 'analysis/onAnalysisStatus',
        ...options
      }
    )
  },

  serverAnalysisEstimate (filename: string, estimator_config?: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Analysis.EstimateResponse>(
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

  serverAnalysisProcess (filename: string, estimator_config?: string, force?: boolean, options?: NotifyOptions) {
    return baseEmit<Moonraker.Analysis.ProcessResponse>(
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

  accessInfo (options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.InfoResponse>(
      'access.info', {
        ...options
      }
    )
  },

  accessRefreshJwt (refresh_token: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.RefreshJwtResponse>(
      'access.refresh_jwt', {
        ...options,
        params: {
          refresh_token
        }
      }
    )
  },

  accessLogin (username: string, password: string, source: string = 'moonraker', options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.LoginResponse>(
      'access.login', {
        ...options,
        params: {
          username,
          password,
          source
        }
      }
    )
  },

  accessLogout (options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.LogoutResponse>(
      'access.logout', {
        ...options
      }
    )
  },

  accessOneshotToken (options?: NotifyOptions) {
    return baseEmit<Moonraker.StringResponse>(
      'access.oneshot_token', {
        ...options
      }
    )
  },

  accessGetUser (options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.GetUserResponse>(
      'access.get_user', {
        ...options
      }
    )
  },

  accessUsersList (options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.UsersListResponse>(
      'access.users.list', {
        ...options
      }
    )
  },

  accessPostUser (username: string, password: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.PostUserResponse>(
      'access.post_user', {
        ...options,
        params: {
          username,
          password
        }
      }
    )
  },

  accessDeleteUser (username: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.DeleteUserResponse>(
      'access.delete_user', {
        ...options,
        params: {
          username
        }
      }
    )
  },

  accessUserPassword (password: string, new_password: string, options?: NotifyOptions) {
    return baseEmit<Moonraker.Authorization.UserPasswordResponse>(
      'access.user.password', {
        ...options,
        params: {
          password,
          new_password
        }
      }
    )
  },

  accessGetApiKey (options?: NotifyOptions) {
    return baseEmit<Moonraker.StringResponse>(
      'access.get_api_key', {
        ...options
      }
    )
  },

  accessPostApiKey (options?: NotifyOptions) {
    return baseEmit<Moonraker.StringResponse>(
      'access.post_api_key', {
        ...options
      }
    )
  },

  serverSpoolmanGetSpoolId (options?: NotifyOptions) {
    return baseEmit<Moonraker.Spoolman.SpoolIdResponse>(
      'server.spoolman.get_spool_id', {
        dispatch: 'spoolman/onActiveSpool',
        ...options
      }
    )
  },

  serverSpoolmanPostSpoolId (spoolId: number | undefined, options?: NotifyOptions) {
    return baseEmit<Moonraker.Spoolman.SpoolIdResponse>(
      'server.spoolman.post_spool_id', {
        dispatch: 'spoolman/onActiveSpool',
        ...options,
        params: {
          spool_id: spoolId
        }
      }
    )
  },

  serverSpoolmanProxyGetAvailableSpools (options?: NotifyOptions) {
    return baseEmit<Moonraker.Spoolman.ProxyResponse<Moonraker.Spoolman.Spool[]>>(
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

  serverSpoolmanProxyGetInfo (options?: NotifyOptions) {
    return baseEmit<Moonraker.Spoolman.ProxyResponse<Moonraker.Spoolman.Info>>(
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

  serverSpoolmanProxyGetSettingCurrency (options?: NotifyOptions) {
    return baseEmit<Moonraker.Spoolman.ProxyResponse<Moonraker.Spoolman.Currency>>(
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
