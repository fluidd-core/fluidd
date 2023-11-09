import Vue from 'vue'
import { Globals, Waits } from '@/globals'
import type { NotifyOptions } from '@/plugins/socketClient'
import { consola } from 'consola'
import type { TimelapseWritableSettings } from '@/store/timelapse/types'

const baseEmit = (method: string, options: NotifyOptions) => {
  if (!Vue.$socket) {
    consola.warn('Socket emit denied, socket not ready.', method, options)
    return
  }
  Vue.$socket.emit(method, options)
}

export const SocketActions = {
  async machineServicesRestart (service: string) {
    const wait = Waits.onServiceRestart
    baseEmit(
      'machine.services.restart', {
        dispatch: 'void',
        params: { service },
        wait
      }
    )
  },

  async machineServicesStart (service: string) {
    const wait = Waits.onServiceStart
    baseEmit(
      'machine.services.start', {
        dispatch: 'void',
        params: { service },
        wait
      }
    )
  },

  async machineServicesStop (service: string) {
    const wait = Waits.onServiceStop
    baseEmit(
      'machine.services.stop', {
        dispatch: 'void',
        params: { service },
        wait
      }
    )
  },

  async machineReboot () {
    baseEmit(
      'machine.reboot', {
        dispatch: 'void'
      }
    )
  },

  async machineShutdown () {
    baseEmit(
      'machine.shutdown', {
        dispatch: 'void'
      }
    )
  },

  async machineUpdateStatus (refresh = false) {
    baseEmit(
      'machine.update.status', {
        dispatch: 'version/onUpdateStatus',
        params: { refresh },
        wait: Waits.onVersionRefresh
      }
    )
  },

  async machineUpdateRefresh (name?: string) {
    baseEmit(
      'machine.update.refresh', {
        dispatch: 'version/onUpdateStatus',
        params: { name },
        wait: Waits.onVersionRefresh
      }
    )
  },

  async machineUpdateRecover (name: string, hard = false) {
    const dispatch = name === 'moonraker'
      ? 'version/onUpdatedMoonraker'
      : name === 'klipper'
        ? 'version/onUpdatedKlipper'
        : 'version/onUpdatedClient'
    baseEmit(
      'machine.update.recover', {
        dispatch,
        params: { name, hard }
      }
    )
  },

  async machineUpdateMoonraker () {
    baseEmit(
      'machine.update.moonraker', {
        dispatch: 'version/onUpdatedMoonraker'
      }
    )
  },

  async machineUpdateKlipper () {
    baseEmit(
      'machine.update.klipper', {
        dispatch: 'version/onUpdatedKlipper',
        params: {
          include_deps: true
        }
      }
    )
  },

  async machineUpdateClient (name: string) {
    const dispatch = name === 'fluidd'
      ? 'version/onUpdatedFluidd'
      : 'version/onUpdatedClient'
    baseEmit(
      'machine.update.client', {
        dispatch,
        params: { name }
      }
    )
  },

  async machineUpdateSystem () {
    baseEmit(
      'machine.update.system', {
        dispatch: 'version/onUpdatedSystem'
      }
    )
  },

  async machineUpdateAll () {
    baseEmit(
      'machine.update.full', {
        dispatch: 'version/onUpdatedAll'
      }
    )
  },

  async machineProcStats () {
    baseEmit(
      'machine.proc_stats', {
        dispatch: 'server/onMachineProcStats'
      }
    )
  },

  async machineSystemInfo () {
    baseEmit(
      'machine.system_info', {
        dispatch: 'server/onMachineSystemInfo'
      }
    )
  },

  async machineDevicePowerDevices () {
    baseEmit(
      'machine.device_power.devices', {
        dispatch: 'power/onInit'
      }
    )
  },

  async machineDevicePowerStatus (device: string) {
    baseEmit(
      'machine.device_power.status', {
        dispatch: 'power/onStatus',
        params: { [device]: null }
      }
    )
  },

  async machineDevicePowerToggle (device: string, state: string, wait?: string) {
    const emit = (state === 'on')
      ? 'machine.device_power.on'
      : 'machine.device_power.off'
    baseEmit(
      emit, {
        dispatch: 'power/onToggle',
        params: { [device]: null },
        wait
      }
    )
  },

  async machineTimelapseSetSettings (settings: Partial<TimelapseWritableSettings>, wait?: string) {
    baseEmit(
      'machine.timelapse.post_settings', {
        dispatch: 'timelapse/onSettings',
        params: settings,
        wait
      }
    )
  },

  async machineTimelapseSaveFrames (wait?: string) {
    baseEmit(
      'machine.timelapse.saveframes', {
        wait
      }
    )
  },

  async machineTimelapseRender () {
    baseEmit('machine.timelapse.render', {})
  },

  async printerInfo () {
    baseEmit(
      'printer.info', {
        dispatch: 'printer/onPrinterInfo'
      }
    )
  },

  async printerRestart () {
    baseEmit(
      'printer.restart', {
        dispatch: 'void',
        wait: Waits.onKlipperRestart
      }
    )
  },

  async printerFirmwareRestart () {
    baseEmit(
      'printer.firmware_restart', {
        dispatch: 'void',
        wait: Waits.onKlipperFirmwareRestart
      }
    )
  },

  async printerQueryEndstops () {
    baseEmit(
      'printer.query_endstops.status', {
        dispatch: 'printer/onQueryEndstops',
        wait: Waits.onQueryEndstops
      }
    )
  },

  async printerObjectsList () {
    baseEmit(
      'printer.objects.list', {
        dispatch: 'printer/onPrinterObjectsList'
      }
    )
  },

  async printerObjectsSubscribe (objects: {[key: string]: null}) {
    baseEmit(
      'printer.objects.subscribe', {
        dispatch: 'printer/onPrinterObjectsSubscribe',
        params: {
          objects
        }
      }
    )
  },

  async printerPrintStart (path: string) {
    baseEmit(
      'printer.print.start', {
        dispatch: 'void',
        params: {
          filename: path
        }
      }
    )
  },

  async printerPrintCancel () {
    baseEmit(
      'printer.print.cancel', {
        dispatch: 'printer/onPrintCancel',
        wait: Waits.onPrintCancel
      }
    )
  },

  async printerPrintPause () {
    baseEmit(
      'printer.print.pause', {
        dispatch: 'printer/onPrintPause',
        wait: Waits.onPrintPause
      }
    )
  },

  async printerPrintResume () {
    baseEmit(
      'printer.print.resume', {
        dispatch: 'printer/onPrintResume',
        wait: Waits.onPrintResume
      }
    )
  },

  async printerGcodeScript (gcode: string, wait?: string) {
    baseEmit(
      'printer.gcode.script', {
        dispatch: 'console/onGcodeScript',
        params: {
          script: gcode
        },
        wait
      }
    )
  },

  async printerGcodeHelp () {
    baseEmit(
      'printer.gcode.help', {
        dispatch: 'console/onGcodeHelp'
      }
    )
  },

  async printerEmergencyStop () {
    baseEmit(
      'printer.emergency_stop', {
        dispatch: 'void'
      }
    )
  },

  async serverInfo () {
    baseEmit(
      'server.info', {
        dispatch: 'server/onServerInfo'
      }
    )
  },

  async identify (params?: { client_name: string, version: string, type: string, url: string }) {
    baseEmit('server.connection.identify', {
      dispatch: 'socket/onConnectionId',
      params
    })
  },

  async timelapseState () {
    baseEmit(
      'machine.timelapse.get_settings', {
        dispatch: 'timelapse/onSettings'
      }
    )

    baseEmit(
      'machine.timelapse.lastframeinfo', {
        dispatch: 'timelapse/onLastFrame'
      }
    )
  },

  async serverConfig () {
    baseEmit(
      'server.config', {
        dispatch: 'server/onServerConfig'
      }
    )
  },

  /**
   * Writes data to moonraker's DB.
   */
  async serverWrite (key: string, value: unknown, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE) {
    baseEmit(
      'server.database.post_item', {
        params: {
          namespace,
          key,
          value
        }
      }
    )
  },

  async serverDelete (key: string, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE) {
    baseEmit(
      'server.database.delete_item', {
        params: {
          namespace,
          key
        }
      }
    )
  },

  async serverRead (key?: string, namespace: string = Globals.MOONRAKER_DB.fluidd.NAMESPACE) {
    baseEmit(
      'server.database.get_item', {
        dispatch: 'socket/onServerRead',
        params: {
          namespace,
          key
        }
      }
    )
  },

  async serverRestart () {
    baseEmit(
      'server.restart', {
        dispatch: 'void'
      }
    )
  },

  async serverTemperatureStore () {
    baseEmit(
      'server.temperature_store', {
        dispatch: 'charts/initTempStore',
        params: {
          include_monitors: true
        }
      }
    )
  },

  async serverGcodeStore () {
    baseEmit(
      'server.gcode_store', {
        dispatch: 'console/onGcodeStore'
      }
    )
  },

  async serverHistoryList (params?: { start?: number; limit?: number; before?: number; since?: number; order?: string }) {
    baseEmit(
      'server.history.list', {
        dispatch: 'history/onHistoryList',
        params
      }
    )
  },

  async serverHistoryTotals () {
    baseEmit(
      'server.history.totals', {
        dispatch: 'history/onHistoryTotals'
      }
    )
  },

  async serverHistoryDeleteJob (uid: string) {
    const params = uid === 'all'
      ? {
          all: true
        }
      : { uid }

    baseEmit(
      'server.history.delete_job', {
        dispatch: 'history/onDelete',
        params
      }
    )
  },

  async serverHistoryResetTotals () {
    baseEmit(
      'server.history.reset_totals', {
        dispatch: 'history/onHistoryChange'
      }
    )
  },

  async serverJobQueueStatus () {
    baseEmit(
      'server.job_queue.status', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue
      }
    )
  },

  async serverJobQueuePostJob (filenames: string[], reset?: boolean) {
    baseEmit(
      'server.job_queue.post_job', {
        dispatch: 'jobQueue/onJobQueueStatus',
        params: {
          filenames,
          reset
        },
        wait: Waits.onJobQueue
      }
    )
  },

  async serverJobQueueDeleteJobs (jobIds: string[]) {
    const params = jobIds.length > 0 && jobIds[0] === 'all'
      ? { all: true }
      : { job_ids: jobIds }

    baseEmit(
      'server.job_queue.delete_job', {
        dispatch: 'jobQueue/onJobQueueStatus',
        params,
        wait: Waits.onJobQueue
      }
    )
  },

  async serverJobQueuePause () {
    baseEmit(
      'server.job_queue.pause', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue
      }
    )
  },

  async serverJobQueueStart () {
    baseEmit(
      'server.job_queue.start', {
        dispatch: 'jobQueue/onJobQueueStatus',
        wait: Waits.onJobQueue
      }
    )
  },

  /**
   * Loads the metadata for a given filepath.
   * Expects the full path including root.
   * Optionally pass the just the filename and path.
   */
  async serverFilesMetadata (filepath: string) {
    baseEmit(
      'server.files.metadata', {
        dispatch: 'files/onFileMetaData',
        params: { filename: filepath }
      }
    )
  },

  async serverFilesMetascan (filepath: string) {
    baseEmit(
      'server.files.metascan', {
        dispatch: 'files/onFileMetaData',
        params: { filename: filepath }
      }
    )
  },

  /**
   * This only requires path, but we pass root along too
   * for brevity.
   */
  async serverFilesGetDirectory (root: string, path: string) {
    const wait = `${Waits.onFileSystem}/${root}/${path}/`
    baseEmit(
      'server.files.get_directory',
      {
        dispatch: 'files/onServerFilesGetDirectory',
        wait,
        params: { root, path, extended: true }
      }
    )
  },

  async serverFilesListRoot (root: string) {
    const wait = `${Waits.onFileSystem}/${root}/`
    baseEmit(
      'server.files.list',
      {
        dispatch: 'files/onServerFilesListRoot',
        wait,
        params: { root }
      }
    )
  },

  async serverFilesMove (source: string, dest: string) {
    const wait = `${Waits.onFileSystem}/${source}/`
    baseEmit(
      'server.files.move', {
        dispatch: 'void',
        wait,
        params: {
          source,
          dest
        }
      }
    )
  },

  async serverFilesCopy (source: string, dest: string) {
    const wait = `${Waits.onFileSystem}/${source}/`
    baseEmit(
      'server.files.copy', {
        dispatch: 'void',
        wait,
        params: {
          source,
          dest
        }
      }
    )
  },

  async serverFilesZip (dest: string, items: string[], store_only?: boolean) {
    const wait = `${Waits.onFileSystem}/${dest}/`
    baseEmit(
      'server.files.zip', {
        dispatch: 'void',
        wait,
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
  async serverFilesPostDirectory (path: string) {
    const wait = `${Waits.onFileSystem}/${path}/`
    baseEmit(
      'server.files.post_directory', {
        dispatch: 'void',
        wait,
        params: {
          path
        }
      }
    )
  },

  async serverFilesDeleteFile (path: string) {
    const wait = `${Waits.onFileSystem}/${path}/`
    baseEmit(
      'server.files.delete_file', {
        dispatch: 'void',
        wait,
        params: {
          path
        }
      }
    )
  },

  async serverFilesDeleteDirectory (path: string, force = false) {
    const wait = `${Waits.onFileSystem}/${path}/`
    baseEmit(
      'server.files.delete_directory', {
        dispatch: 'void',
        wait,
        params: {
          path,
          force
        }
      }
    )
  },

  async serverAnnouncementsList () {
    baseEmit(
      'server.announcements.list', {
        dispatch: 'announcements/onAnnouncementsList'
      }
    )
  },

  async serverAnnouncementsDismiss (entry_id: string, wake_time?: number) {
    baseEmit(
      'server.announcements.dismiss', {
        dispatch: 'void',
        params: {
          entry_id,
          wake_time
        }
      }
    )
  },

  async serverLogsRollover (application?: string) {
    baseEmit(
      'server.logs.rollover', {
        dispatch: 'server/onLogsRollOver',
        params: {
          application
        }
      }
    )
  },

  async serverWebcamsList () {
    baseEmit(
      'server.webcams.list', {
        dispatch: 'webcams/onWebcamsList'
      }
    )
  },

  async serverSensorsList () {
    baseEmit(
      'server.sensors.list', {
        dispatch: 'sensors/onSensorsList'
      }
    )
  },

  async serverSpoolmanGetSpoolId () {
    baseEmit(
      'server.spoolman.get_spool_id', {
        dispatch: 'spoolman/onActiveSpool'
      }
    )
  },

  async serverSpoolmanPostSpoolId (spoolId: number | undefined) {
    baseEmit(
      'server.spoolman.post_spool_id', {
        params: { spool_id: spoolId },
        dispatch: 'spoolman/onActiveSpool'
      }
    )
  },

  async serverSpoolmanProxyGetAvailableSpools () {
    baseEmit(
      'server.spoolman.proxy', {
        params: {
          request_method: 'GET',
          path: '/v1/spool'
        },
        dispatch: 'spoolman/onAvailableSpools'
      }
    )
  }
}
