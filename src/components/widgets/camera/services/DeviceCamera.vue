<template>
  <video
    ref="streamingElement"
    autoplay
    muted
    :style="cameraStyle"
  />
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import consola from 'consola'

@Component({})
export default class DeviceCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  cameraNameMenuItems: { text: string, value: string }[] = []

  async startPlayback () {
    const stream = await this.getUserMedia()

    this.cameraVideo.srcObject = stream
    this.$emit('playback')

    this.$emit('update:camera-name', await this.getDeviceLabel())
  }

  stopPlayback () {
    try {
      const stream = this.cameraVideo.srcObject as MediaStream

      if (stream) {
        for (const track of stream.getTracks()) {
          track.stop()
          stream.removeTrack(track)
        }
      }
    } catch (e) {
      consola.error('[DeviceCamera] failed to stop and remove all tracks', e)
    }

    this.cameraVideo.srcObject = null
  }

  async getUserMedia () {
    const selectedDeviceCamera = this.getSelectedDeviceCamera()

    try {
      const key: keyof MediaTrackConstraints = ['environment', 'user'].includes(selectedDeviceCamera)
        ? 'facingMode'
        : 'deviceId'

      return await navigator.mediaDevices.getUserMedia({
        video: {
          [key]: selectedDeviceCamera
        }
      })
    } catch (e) {
      consola.error(`[DeviceCamera] failed to select device "${selectedDeviceCamera}"`, e)

      this.setSelectedDeviceCamera(null)

      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment'
        }
      })
    }
  }

  async enumerateDevices () {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      return devices
        .filter(device => device.kind === 'videoinput')
    } catch (e) {
      consola.error('[DeviceCamera] failed to enumerate devices', e)

      return []
    }
  }

  async getDeviceLabel () {
    if (this.cameraNameMenuItems.length === 0) {
      const devices = await this.enumerateDevices()

      this.cameraNameMenuItems = [
        {
          text: this.$tc('app.general.label.environment_facing'),
          value: 'environment'
        },
        {
          text: this.$tc('app.general.label.user_facing'),
          value: 'user'
        },
        ...devices
          .map(device => ({
            text: device.label,
            value: device.deviceId
          }))
      ]

      this.$emit('update:camera-name-menu-items', this.cameraNameMenuItems)
    }

    const selectedDeviceCamera = this.getSelectedDeviceCamera()

    return this.cameraNameMenuItems
      .find(item => item.value === selectedDeviceCamera)?.text
  }

  getSelectedDeviceCamera () {
    return localStorage.getItem('deviceCamera.selectedCamera') ?? 'environment'
  }

  setSelectedDeviceCamera (value?: string | null) {
    if (value) {
      localStorage.setItem('deviceCamera.selectedCamera', value)
    } else {
      localStorage.removeItem('deviceCamera.selectedCamera')
    }
  }

  menuItemClick (value: string) {
    if (this.getSelectedDeviceCamera() !== value) {
      this.setSelectedDeviceCamera(value)

      this.stopPlayback()
      this.startPlayback()
    }
  }
}
</script>
