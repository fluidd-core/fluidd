import Vue from 'vue'
import { Globals, Waits } from '@/globals'
import type { EmitOptions, NotifyOptions } from '@/plugins/socketClient'
import { consola } from 'consola'

const baseEmit = async <
  M extends Moonraker.Method,
  R extends Moonraker.MethodResult<M> = Moonraker.MethodResult<M>
> (method: M, options: EmitOptions<M>): Promise<R> => {
  if (!Vue.$socket) {
    consola.warn('Socket emit denied, socket not ready.', method, options)

    throw new Error('Socket not ready')
  } else {
    return Vue.$socket.emit<M, R>(method, options)
  }
}

export const SocketActions = {
  machineServicesRestart (service: string, options?: NotifyOptions) {
    return baseEmit(
      'machine.services.restart', {
        wait: Waits.onServiceRestart,
        ...options,
        params: {
          service
        }
      }
    )
  },

  machineServicesStart (service: string, options?: NotifyOptions) {
    return baseEmit(
      'machine.services.start', {
        wait: Waits.onServiceStart,
        ...options,
        params: {
          service
        },
      }
    )
  },

  machineServicesStop (service: string, options?: NotifyOptions) {
    return baseEmit(
      'machine.services.stop', {
        wait: Waits.onServiceStop,
        ...options,
        params: {
          service
        }
      }
    )
  },

  machineReboot (options?: NotifyOptions) {
    return baseEmit(
      'machine.reboot', {
        ...options
      }
    )
  },

  machineShutdown (options?: NotifyOptions) {
    return baseEmit(
      'machine.shutdown', {
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

    return baseEmit(
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
    return baseEmit(
      'machine.update.moonraker', {
        dispatch: 'version/onUpdatedMoonraker',
        ...options
      }
    )
  },

  machineUpdateKlipper (options?: NotifyOptions) {
    return baseEmit(
      'machine.update.klipper', {
        dispatch: 'version/onUpdatedKlipper',
        ...options
      }
    )
  },

  machineUpdateClient (name: string, options?: NotifyOptions) {
    const dispatch = name === 'fluidd'
      ? 'version/onUpdatedFluidd'
      : 'version/onUpdatedClient'

    return baseEmit(
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
    return baseEmit(
      'machine.update.system', {
        dispatch: 'version/onUpdatedSystem',
        ...options
      }
    )
  },

  machineUpdateAll (options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'machine.device_power.devices', {
        dispatch: 'power/onInit',
        ...options
      }
    )
  },

  machineDevicePowerStatus (device: string, options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
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
    return baseEmit(
      'machine.peripherals.usb', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsUsb,
        ...options
      }
    )
  },

  machinePeripheralsSerial (options?: NotifyOptions) {
    return baseEmit(
      'machine.peripherals.serial', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsSerial,
        ...options
      }
    )
  },

  machinePeripheralsVideo (options?: NotifyOptions) {
    return baseEmit(
      'machine.peripherals.video', {
        dispatch: 'server/onMachinePeripherals',
        wait: Waits.onMachinePeripheralsVideo,
        ...options
      }
    )
  },

  machinePeripheralsCanbus (canbusInterface: string, options?: NotifyOptions) {
    return baseEmit(
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

  machineTimelapsePostSettings (settings: Partial<Moonraker.Timelapse.WriteableSettings>, options?: NotifyOptions) {
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
    return baseEmit(
      'printer.info', {
        dispatch: 'printer/onPrinterInfo',
        ...options
      }
    )
  },

  printerRestart (options?: NotifyOptions) {
    return baseEmit(
      'printer.restart', {
        wait: Waits.onKlipperRestart,
        ...options
      }
    )
  },

  printerFirmwareRestart (options?: NotifyOptions) {
    return baseEmit(
      'printer.firmware_restart', {
        wait: Waits.onKlipperFirmwareRestart,
        ...options
      }
    )
  },

  printerQueryEndstops (options?: NotifyOptions) {
    return baseEmit(
      'printer.query_endstops.status', {
        dispatch: 'printer/onQueryEndstops',
        wait: Waits.onQueryEndstops,
        ...options
      }
    )
  },

  printerObjectsList (options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'printer.print.start', {
        ...options,
        params: {
          filename: path
        }
      }
    )
  },

  printerPrintCancel (options?: NotifyOptions) {
    return baseEmit(
      'printer.print.cancel', {
        dispatch: 'printer/onPrintCancel',
        wait: Waits.onPrintCancel,
        ...options
      }
    )
  },

  printerPrintPause (options?: NotifyOptions) {
    return baseEmit(
      'printer.print.pause', {
        dispatch: 'printer/onPrintPause',
        wait: Waits.onPrintPause,
        ...options
      }
    )
  },

  printerPrintResume (options?: NotifyOptions) {
    return baseEmit(
      'printer.print.resume', {
        dispatch: 'printer/onPrintResume',
        wait: Waits.onPrintResume,
        ...options
      }
    )
  },

  printerGcodeScript (gcode: string, options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'printer.gcode.help', {
        dispatch: 'console/onGcodeHelp',
        ...options
      }
    )
  },

  printerEmergencyStop (options?: NotifyOptions) {
    return baseEmit(
      'printer.emergency_stop', {
        ...options
      }
    )
  },

  serverInfo (options?: NotifyOptions) {
    return baseEmit(
      'server.info', {
        dispatch: 'server/onServerInfo',
        ...options
      }
    )
  },

  serverConnectionIdentify (params: Moonraker.Websocket.ConnectionIdentifyParams, options?: NotifyOptions) {
    return baseEmit(
      'server.connection.identify', {
        dispatch: 'socket/onConnectionId',
        ...options,
        params
      })
  },

  serverConfig (options?: NotifyOptions) {
    return baseEmit(
      'server.config', {
        dispatch: 'server/onServerConfig',
        ...options
      }
    )
  },

  serverDatabaseList (options?: NotifyOptions) {
    return baseEmit(
      'server.database.list', {
        dispatch: 'database/onServerDatabaseList',
        wait: Waits.onDatabaseList,
        ...options
      }
    )
  },

  serverDatabaseCompact (options?: NotifyOptions) {
    return baseEmit(
      'server.database.compact', {
        wait: Waits.onDatabaseCompact,
        ...options
      }
    )
  },

  serverDatabasePostBackup (filename: string, options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
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
    return baseEmit(
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

  serverDatabasePostItem<T = unknown> (key: string | string[], value: T, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    return baseEmit<'server.database.post_item', Moonraker.Database.PostItemResponse<T>>(
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

  serverDatabaseDeleteItem<T = unknown> (key: string | string[], namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    return baseEmit<'server.database.delete_item', Moonraker.Database.DeleteItemResponse<T>>(
      'server.database.delete_item', {
        ...options,
        params: {
          namespace,
          key
        }
      }
    )
  },

  serverDatabaseGetItem<T = unknown> (key?: string | string[], namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE, options?: NotifyOptions) {
    return baseEmit<'server.database.get_item', Moonraker.Database.GetItemResponse<T>>(
      'server.database.get_item', {
        ...options,
        params: {
          namespace,
          key
        }
      }
    )
  },

  serverRestart (options?: NotifyOptions) {
    return baseEmit(
      'server.restart', {
        ...options
      }
    )
  },

  serverTemperatureStore (options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'server.gcode_store', {
        dispatch: 'console/onGcodeStore',
        ...options
      }
    )
  },

  serverHistoryGetJob (uid: string, options?: NotifyOptions) {
    // Answered to the caller, which commits jobs in batches.
    return baseEmit(
      'server.history.get_job', {
        ...options,
        params: {
          uid
        }
      }
    )
  },

  serverHistoryList (params?: Moonraker.History.ListParams, options?: NotifyOptions) {
    return baseEmit(
      'server.history.list', {
        dispatch: 'history/onHistoryList',
        ...options,
        params
      }
    )
  },

  serverHistoryTotals (options?: NotifyOptions) {
    return baseEmit(
      'server.history.totals', {
        dispatch: 'history/onHistoryTotals',
        ...options
      }
    )
  },

  serverHistoryDeleteJob (uid: string, options?: NotifyOptions) {
    const params: Moonraker.MethodParams<'server.history.delete_job'> = uid === 'all'
      ? { all: true }
      : { uid }

    return baseEmit(
      'server.history.delete_job', {
        dispatch: 'history/onDelete',
        ...options,
        params
      }
    )
  },

  serverHistoryResetTotals (options?: NotifyOptions) {
    return baseEmit(
      'server.history.reset_totals', {
        dispatch: 'history/onHistoryTotals',
        ...options
      }
    )
  },

  serverJobQueueStatus (options?: NotifyOptions) {
    return baseEmit(
      'server.job_queue.status', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options
      }
    )
  },

  serverJobQueuePostJob (filenames: string[], reset?: boolean, options?: NotifyOptions) {
    return baseEmit(
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
    const params: Moonraker.MethodParams<'server.job_queue.delete_job'> = jobIds.length > 0 && jobIds[0] === 'all'
      ? { all: true }
      : { job_ids: jobIds }

    return baseEmit(
      'server.job_queue.delete_job', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options,
        params
      }
    )
  },

  serverJobQueuePause (options?: NotifyOptions) {
    return baseEmit(
      'server.job_queue.pause', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue,
        ...options
      }
    )
  },

  serverJobQueueStart (options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
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
    return baseEmit(
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
    return baseEmit(
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

  serverFilesRoots (options?: NotifyOptions) {
    return baseEmit(
      'server.files.roots',
      {
        dispatch: 'files/onServerFilesRoots',
        wait: Waits.onFileSystemRoots,
        ...options
      }
    )
  },

  serverFilesList (root: string, options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'server.files.move', {
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
    return baseEmit(
      'server.files.copy', {
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
    return baseEmit(
      'server.files.zip', {
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
    return baseEmit(
      'server.files.post_directory', {
        wait: `${Waits.onFileSystem}/${path}/`,
        ...options,
        params: {
          path
        }
      }
    )
  },

  serverFilesDeleteFile (path: string, options?: NotifyOptions) {
    return baseEmit(
      'server.files.delete_file', {
        wait: `${Waits.onFileSystem}/${path}`,
        ...options,
        params: {
          path
        }
      }
    )
  },

  serverFilesDeleteDirectory (path: string, force = false, options?: NotifyOptions) {
    return baseEmit(
      'server.files.delete_directory', {
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
    return baseEmit(
      'server.announcements.list', {
        dispatch: 'announcements/onAnnouncementsList',
        ...options
      }
    )
  },

  serverAnnouncementsDismiss (entry_id: string, wake_time?: number, options?: NotifyOptions) {
    return baseEmit(
      'server.announcements.dismiss', {
        ...options,
        params: {
          entry_id,
          wake_time
        }
      }
    )
  },

  serverLogsRollover (application?: string, options?: NotifyOptions) {
    return baseEmit(
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

  serverWebcamsWrite (webcam: Moonraker.Webcam.PostItemParams, options?: NotifyOptions) {
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
    return baseEmit(
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
    return baseEmit(
      'server.analysis.status', {
        dispatch: 'analysis/onAnalysisStatus',
        ...options
      }
    )
  },

  serverAnalysisEstimate (filename: string, estimator_config?: string, options?: NotifyOptions) {
    return baseEmit(
      'server.analysis.estimate', {
        wait: `${Waits.onFileSystem}/gcodes/${filename}`,
        ...options,
        params: {
          filename,
          estimator_config
        }
      }
    )
  },

  serverAnalysisProcess (filename: string, estimator_config?: string, force?: boolean, options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'access.info', {
        ...options
      }
    )
  },

  accessRefreshJwt (refresh_token: string, options?: NotifyOptions) {
    return baseEmit(
      'access.refresh_jwt', {
        ...options,
        params: {
          refresh_token
        }
      }
    )
  },

  accessLogin (username: string, password: string, source: Moonraker.Authorization.Source = 'moonraker', options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'access.logout', {
        ...options
      }
    )
  },

  accessOneshotToken (options?: NotifyOptions) {
    return baseEmit(
      'access.oneshot_token', {
        ...options
      }
    )
  },

  accessGetUser (options?: NotifyOptions) {
    return baseEmit(
      'access.get_user', {
        ...options
      }
    )
  },

  accessUsersList (options?: NotifyOptions) {
    return baseEmit(
      'access.users.list', {
        ...options
      }
    )
  },

  accessPostUser (username: string, password: string, options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'access.delete_user', {
        ...options,
        params: {
          username
        }
      }
    )
  },

  accessUserPassword (password: string, new_password: string, options?: NotifyOptions) {
    return baseEmit(
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
    return baseEmit(
      'access.get_api_key', {
        ...options
      }
    )
  },

  accessPostApiKey (options?: NotifyOptions) {
    return baseEmit(
      'access.post_api_key', {
        ...options
      }
    )
  },

  serverSpoolmanGetSpoolId (options?: NotifyOptions) {
    return baseEmit(
      'server.spoolman.get_spool_id', {
        dispatch: 'spoolman/onActiveSpool',
        ...options
      }
    )
  },

  serverSpoolmanPostSpoolId (spoolId: number | undefined, options?: NotifyOptions) {
    return baseEmit(
      'server.spoolman.post_spool_id', {
        dispatch: 'spoolman/onActiveSpool',
        ...options,
        params: {
          spool_id: spoolId
        }
      }
    )
  },

  serverSpoolmanProxyGet<T> (path: string, options?: NotifyOptions) {
    return baseEmit<'server.spoolman.proxy', Moonraker.Spoolman.ProxyResponse<T>>(
      'server.spoolman.proxy', {
        ...options,
        params: {
          request_method: 'GET',
          path,
          use_v2_response: true
        }
      }
    )
  },

  serverSpoolmanProxyGetAvailableSpools (options?: NotifyOptions) {
    return this.serverSpoolmanProxyGet<Moonraker.Spoolman.Spool[]>('/v1/spool', {
      dispatch: 'spoolman/onAvailableSpools',
      ...options
    })
  },

  serverSpoolmanProxyGetInfo (options?: NotifyOptions) {
    return this.serverSpoolmanProxyGet<Moonraker.Spoolman.Info>('/v1/info', {
      dispatch: 'spoolman/onInfo',
      ...options
    })
  },

  serverSpoolmanProxyGetSettingCurrency (options?: NotifyOptions) {
    return this.serverSpoolmanProxyGet<Moonraker.Spoolman.Currency>('/v1/setting/currency', {
      dispatch: 'spoolman/onSettingCurrency',
      ...options
    })
  }
}
