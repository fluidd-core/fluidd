import Vue from 'vue'
import { SocketActions } from '@/api/socketActions'
import { Component } from 'vue-property-decorator'

@Component
export default class ServicesMixin extends Vue {
  get moonrakerServiceName (): string {
    const moonrakerServiceName: string | undefined = this.$typedState.server.system_info?.instance_ids?.moonraker

    return moonrakerServiceName || 'moonraker'
  }

  get klipperServiceName (): string {
    const klipperServiceName: string | undefined = this.$typedState.server.system_info?.instance_ids?.klipper

    return klipperServiceName || 'klipper'
  }

  /**
   * Resets the UI when restarting/resetting Klipper
   */
  async _klipperReset () {
    await this.$store.dispatch('resetKlippy', undefined, { root: true })
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
    this.serviceRestartByName(this.klipperServiceName)
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
      if (name === this.klipperServiceName) {
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
      if (name === this.klipperServiceName) {
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
