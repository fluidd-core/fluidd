<template>
  <v-sheet
    :elevation="0"
    class="camera-container"
    v-on="$listeners"
  >
    <template v-if="cameraComponent">
      <component
        :is="cameraComponent"
        ref="component-instance"
        :camera="camera"
        :crossorigin="crossorigin"
        class="camera-image"
        @update:status="status = $event"
        @update:camera-name="cameraName = $event"
        @update:camera-name-menu-items="cameraNameMenuItems = $event"
        @update:raw-camera-url="rawCameraUrl = $event"
        @update:frames-per-second="framesPerSecond = $event"
      />
    </template>
    <div v-else>
      Camera service not supported!
    </div>

    <template v-if="cameraName || camera.name">
      <v-menu
        v-if="cameraNameMenuItems.length > 0"
        top
        offset-y
        transition="slide-y-reverse-transition"
      >
        <template #activator="{ on, attrs, value }">
          <div
            v-bind="attrs"
            class="camera-name"
            v-on="on"
          >
            {{ cameraNameAndStatus }}
            <v-icon
              small
              class="ml-1"
              :class="{ 'rotate-180': value }"
            >
              $chevronDown
            </v-icon>
          </div>
        </template>
        <v-list dense>
          <v-list-item
            v-for="(item, index) in cameraNameMenuItems"
            :key="index"
            @click="cameraNameMenuItemClick(item)"
          >
            <v-list-item-icon>
              <v-icon>
                {{ item.icon }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ item.text }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <div
        v-else
        class="camera-name"
      >
        {{ cameraNameAndStatus }}
      </div>
    </template>

    <div
      v-if="framesPerSecond"
      class="camera-frames"
    >
      fps: {{ framesPerSecond }}
    </div>

    <div
      v-if="!fullscreen && (fullscreenMode === 'embed' || !rawCameraUrl) && camera.service !== 'device'"
      class="camera-fullscreen"
    >
      <a :href="`/#/camera/${encodeURIComponent(camera.uid)}`">
        <v-icon>$fullScreen</v-icon>
      </a>
    </div>
    <div
      v-else-if="rawCameraUrl"
      class="camera-fullscreen"
    >
      <a
        :href="rawCameraUrl"
        target="_blank"
      >
        <v-icon>$openInNew</v-icon>
      </a>
    </div>
  </v-sheet>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator'
import type { WebcamConfig } from '@/store/webcams/types'
import type { CameraFullscreenAction } from '@/store/config/types'
import { CameraComponents } from '@/dynamicImports'
import CameraMixin from '@/mixins/camera'
import type { CameraConnectionStatus, CameraNameMenuItem } from '@/types'

@Component({})
export default class CameraItem extends Vue {
  @Prop({ type: Object, required: true })
  readonly camera!: WebcamConfig

  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  @Prop({ type: String })
  readonly crossorigin?: 'anonymous' | 'use-credentials' | ''

  @Ref('component-instance')
  readonly componentInstance!: CameraMixin

  status: CameraConnectionStatus = 'disconnected'
  rawCameraUrl = ''
  framesPerSecond = ''
  cameraName = ''
  cameraNameMenuItems: CameraNameMenuItem[] = []

  @Watch('status')
  onStatus (value: CameraConnectionStatus) {
    if (value === 'connected' && this.$listeners?.frame && this.componentInstance) {
      if (this.componentInstance.streamingElement instanceof HTMLImageElement) {
        this.handleFrame()
      } else if (this.componentInstance.streamingElement instanceof HTMLVideoElement) {
        this.handleFrame(true)
      }
    }
  }

  handleFrame (animate = false) {
    const element = this.componentInstance?.streamingElement as HTMLImageElement | HTMLVideoElement
    if (element) {
      this.$emit('frame', element)
    }

    if (animate) {
      requestAnimationFrame(() => this.handleFrame(this.componentInstance?.animating ?? false))
    }
  }

  cameraNameMenuItemClick (item: CameraNameMenuItem) {
    this.componentInstance.menuItemClick(item)
  }

  @Watch('camera')
  onCamera () {
    this.status = 'disconnected'
    this.rawCameraUrl = ''
    this.framesPerSecond = ''
    this.cameraName = ''
    this.cameraNameMenuItems = []
  }

  get fullscreenMode (): CameraFullscreenAction {
    return this.$store.state.config.uiSettings.general.cameraFullscreenAction
  }

  get cameraComponent () {
    if (this.camera.service) {
      const componentName = `${this.$filters.startCase(this.camera.service).replace(/ /g, '')}Camera`

      if (componentName in CameraComponents) {
        return CameraComponents[componentName]
      }
    }
  }

  get cameraNameAndStatus () {
    const cameraName = this.cameraName || this.camera.name

    if (this.status !== 'connected') {
      return `${cameraName} (${this.status})`
    }

    return cameraName
  }
}
</script>

<style lang="scss" scoped>
  .camera-image {
    display: block;
    max-width: 100%;
    max-height: calc(100vh - 130px);
    max-height: calc(100svh - 130px);
    white-space: nowrap;
    margin: auto;
    pointer-events: none;
    user-select: none;
  }

  .camera-container {
    position: relative;
    background: rgba(0, 0, 0, 1);
    min-height: 70px;
  }

  .camera-name,
  .camera-frames {
    position: absolute;
    bottom: 0;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
    font-weight: 100;
  }

  .theme--light .camera-name,
  .theme--light .camera-frames {
    background: rgba(255, 255, 255, 0.75);
  }

  .camera-fullscreen {
    position: absolute;
    text-align: right;
    top: 0;
    right: 0;
    padding: 2px 6px;
    background: rgba(0, 0, 0, 0.75);
    border-bottom-left-radius: 4px;
  }

  .theme--light .camera-fullscreen {
    background: rgba(255, 255, 255, 0.75);
  }

  .camera-name {
    left: 0;
    border-top-right-radius: 4px;
  }

  .camera-frames {
    text-align: right;
    right: 0;
    border-top-left-radius: 4px;
  }
</style>
