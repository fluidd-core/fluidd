import Vue from 'vue'
import { SocketActions } from '@/api/socketActions'
import { Component } from 'vue-property-decorator'

@Component
export default class ServicesMixin extends Vue {
  get moonrakerServiceName (): string {
    const moonrakerServiceName: string | undefined = this.$store.state.server.system_info?.instance_ids?.moonraker

    return moonrakerServiceName || 'moonraker'
  }

  /**
   * Resets the UI when restarting/resetting Klipper
   */
  async _klipperReset () {
    this.$store.commit('socket/setAcceptNotifications', false)
    await this.$store.dispatch('server/resetKlippy', undefined, { root: true })
    await this.$store.dispatch('reset', [
      'printer',
      'charts',
      'wait'
    ], { root: true })
  }

  /**
   * Reboot the klipper host.
   */
  hostReboot () {
    SocketActions.machineReboot()
  }

  /**
   * Shutdown the klipper host.
   */
  hostShutdown () {
    SocketActions.machineShutdown()
  }

  /**
   * Restart the klipper service itself.
   */
  async serviceRestartKlipper () {
    this.serviceRestartByName('klipper')
  }

  /**
   * Restart the moonraker service itself.
   */
  serviceRestartMoonraker () {
    this.serviceRestartByName(this.moonrakerServiceName)
  }

  /**
   * Restart a service by name.
   */
  async serviceRestartByName (name: string) {
    if (name === this.moonrakerServiceName) {
      SocketActions.serverRestart()
      this.$store.commit('socket/setSocketDisconnecting', true)
    } else {
      if (name === 'klipper') {
        await this._klipperReset()
      }

      SocketActions.machineServicesRestart(name)
    }
  }

  /**
   * Start a service by name.
   */
  async serviceStartByName (name: string) {
    SocketActions.machineServicesStart(name)
  }

  /**
   * Stop a service by name.
   */
  async serviceStopByName (name: string) {
    if (name === this.moonrakerServiceName) {
      throw new Error('Stopping the moonraker service is not supported')
    } else {
      if (name === 'klipper') {
        await this._klipperReset()
      }

      SocketActions.machineServicesStop(name)
    }
  }

  /**
   * Restart klippy / std restart.
   */
  async restartKlippy () {
    await this._klipperReset()
    SocketActions.printerRestart()
  }

  /**
   * Restart klippy and the mcu's.
   */
  async firmwareRestartKlippy () {
    await this._klipperReset()
    SocketActions.printerFirmwareRestart()
  }
}
