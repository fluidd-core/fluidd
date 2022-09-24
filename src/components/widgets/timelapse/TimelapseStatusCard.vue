<template>
  <collapsable-card
    :title="$t('app.timelapse.title.timelapse_status')"
    icon="$info"
    class="mb-2 sb-sm-4"
    :draggable="false"
  >
    <v-card-text>
      <v-row>
        <div
          v-if="frameCount"
          style="position: relative"
        >
          <img
            :src="previewUrl"
            class="mx-auto thumbnail"
            :style="{filter: isRendering ? `saturate(${renderStatus.progress}%)` : 'none'}"
          >
          <v-progress-circular
            v-if="isRendering"
            class="render-progress"
            color="primary"
            size="64"
            :value="renderStatus.progress"
          />
        </div>
        <camera-item
          v-else
          :camera="camera"
        />
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-layout justify-center>
            <app-slider
              v-model="selectedFrame"
              full-width
              :label="$tc('app.timelapse.label.frame')"
              :min="1"
              :max="frameCount"
              :suffix="`/ ${frameCount}`"
              :reset-value="frameCount"
              :disabled="!frameCount || isRendering"
              @input="updatePreviewUrl"
            />
          </v-layout>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider />

    <v-card-actions>
      <v-spacer />

      <app-btn
        color="primary"
        text
        :disabled="!frameCount || savingFrames"
        @click="saveFrames()"
      >
        {{ $t('app.timelapse.btn.save_frames') }}
      </app-btn>
      <app-btn
        color="primary"
        :disabled="!frameCount || isRendering"
        @click="$emit('openRenderDialog', true)"
      >
        {{ $t('app.timelapse.btn.render') }}
      </app-btn>
    </v-card-actions>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import AppSlider from '@/components/ui/AppSlider.vue'
import AppSetting from '@/components/ui/AppSetting.vue'
import { RenderStatus, TimelapseLastFrame, TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import AppBtn from '@/components/ui/AppBtn.vue'
import CameraItem from '@/components/widgets/camera/CameraItem.vue'

@Component({
  components: {
    CameraItem,
    AppBtn,
    AppSetting,
    AppSlider,
    CollapsableCard,
    FileSystem
  }
})
export default class StatusCard extends Mixins(StateMixin, FilesMixin) {
  selectedFrameNumber = 0
  previewUrl = ''

  mounted () {
    this.updatePreviewUrl()
  }

  saveFrames () {
    SocketActions.machineTimelapseSaveFrames(this.waits.onTimelapseSaveFrame)
  }

  get savingFrames () {
    return this.hasWait(this.waits.onTimelapseSaveFrame)
  }

  get selectedFrame () {
    return this.selectedFrameNumber || this.frameCount || 0
  }

  set selectedFrame (value: number) {
    this.selectedFrameNumber = value === this.frameCount ? 0 : value
  }

  async updatePreviewUrl () {
    if (this.lastFrame && this.lastFrame?.file) {
      let file = this.lastFrame.file
      if (this.selectedFrame) {
        const [ext] = file.split('.').slice(-1)
        file = `frame${this.selectedFrame.toString().padStart(6, '0')}.${ext}`
      }

      this.previewUrl = await this.createFileUrl(file, 'timelapse_frames')
    }
  }

  get isRendering () {
    return this.renderStatus && this.renderStatus.status !== 'success'
  }

  get frameCount () {
    return this.lastFrame?.uniqueCount
  }

  get camera () {
    return this.$store.getters['cameras/getCameraById'](this.settings.camera) ??
      { url: '/webcam/?action=snapshot', type: 'mjpegstreamer-adaptive' }
  }

  get settings (): TimelapseSettings {
    return this.$store.getters['timelapse/getSettings']
  }

  get lastFrame (): TimelapseLastFrame | undefined {
    return this.$store.getters['timelapse/getLastFrame']
  }

  get renderStatus (): RenderStatus | undefined {
    return this.$store.getters['timelapse/getRenderStatus']
  }
}
</script>

<style lang="scss" scoped>
.thumbnail {
  width: 100%;
}

.render-progress {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
