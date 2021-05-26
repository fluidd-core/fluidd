import Vue from 'vue'
import { SocketActions } from '@/api/socketActions'
import { Component } from 'vue-property-decorator'

@Component
export default class ServicesMixin extends Vue {
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
    this.$store.commit('socket/setAcceptNotifications', false)
    await this.$store.dispatch('reset', [
      'server',
      'printer',
      'charts',
      'wait'
    ], { root: true })

    SocketActions.machineServicesRestart('klipper')
  }

  /**
   * Restart the moonraker service itself.
   */
  serviceRestartMoonraker () {
    SocketActions.serverRestart()
    this.$store.commit('socket/setSocketDisconnecting', true)
  }

  /**
   * Restart the webcamd service itself.
   */
  serviceRestartWebcam () {
    SocketActions.machineServicesRestart('webcamd')
  }

  /**
   * Restart klippy / std restart.
   */
  async restartKlippy () {
    this.$store.commit('socket/setAcceptNotifications', false)
    await this.$store.dispatch('reset', [
      'server',
      'printer',
      'charts',
      'wait'
    ], { root: true })

    SocketActions.printerRestart()
  }

  /**
   * Restart klippy and the mcu's.
   */
  async firmwareRestartKlippy () {
    this.$store.commit('socket/setAcceptNotifications', false)
    await this.$store.dispatch('reset', [
      'server',
      'printer',
      'charts',
      'wait'
    ], { root: true })

    SocketActions.printerFirmwareRestart()
  }
}
