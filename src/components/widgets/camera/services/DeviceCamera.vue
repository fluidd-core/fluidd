<template>
  <video
    ref="streamingElement"
    autoplay
    muted
    :style="cameraStyle"
    @play="updateStatus('connected')"
    @error="updateStatus('error')"
  />
</template>

<script lang="ts">
import { Component, Ref, Mixins } from 'vue-property-decorator'
import CameraMixin from '@/mixins/camera'
import consola from 'consola'
import type { CameraNameMenuItem } from '@/types'

@Component({})
export default class DeviceCamera extends Mixins(CameraMixin) {
  @Ref('streamingElement')
  readonly cameraVideo!: HTMLVideoElement

  async startPlayback () {
    this.updateStatus('connecting')

    try {
      const stream = await this.getUserMedia()

      this.cameraVideo.srcObject = stream
      this.$emit('playback')

      this.updateCameraName(await this.getDeviceLabel() ?? '')
    } catch (e) {
      consola.error(`[DeviceCamera] failed to start playback "${this.getSelectedDeviceCamera()}"`, e)

      this.updateStatus('error')
    }
  }

  stopPlayback () {
    this.updateStatus('disconnected')

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

      const cameraNameMenuItems = [
        {
          icon: '$camera',
          text: this.$tc('app.general.label.environment_facing'),
          value: 'environment'
        },
        {
          icon: '$camera',
          text: this.$tc('app.general.label.user_facing'),
          value: 'user'
        },
        ...devices
          .map(device => ({
            icon: '$camera',
            text: device.label,
            value: device.deviceId
          }))
      ]

      this.updateCameraNameMenuItems(cameraNameMenuItems)
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

  menuItemClick (item: CameraNameMenuItem) {
    if (this.getSelectedDeviceCamera() !== item.value) {
      this.setSelectedDeviceCamera(item.value)

      this.stopPlayback()

      this.updateCameraName(item.text)

      this.startPlayback()
    }
  }
}
</script>
