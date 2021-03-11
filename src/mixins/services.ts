import Vue from 'vue'
import { SocketActions } from '@/socketActions'
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
  serviceRestartKlipper () {
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
  restartKlippy () {
    SocketActions.printerRestart()
  }

  /**
   * Restart klippy and the mcu's.
   */
  firmwareRestartKlippy () {
    SocketActions.printerFirmwareRestart()
  }
}
