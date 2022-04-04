<template>
  <collapsable-card
    v-if="frameCount"
    :title="$t('app.timelapse.title.timelapse_status')"
    icon="$info"
    class="mb-2 sb-sm-4"
    :draggable="false"
  >
    <v-card-text class="px-4">
      <v-row>
        <div style="position: relative">
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
      </v-row>
    </v-card-text>

    <v-divider />

    <v-card-text>
      <v-row>
        <v-col
          cols="6"
          class="text-center"
        >
          {{ $tc('app.timelapse.label.frames', frameCount, { frames: frameCount }) }}
        </v-col>
        <v-col
          cols="6"
          class="text-center"
        >
          {{ $t('app.timelapse.label.length') }}: {{ lengthEstimate }}
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider />

    <v-card-actions>
      <v-spacer />

      <app-btn
        color="primary"
        text
        :disabled="savingFrames"
        @click="saveFrames()"
      >
        {{ $t('app.timelapse.btn.save_frames') }}
      </app-btn>
      <app-btn
        color="primary"
        :disabled="renderStatus && renderStatus.status !== 'success'"
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
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import AppSlider from '@/components/ui/AppSlider.vue'
import AppSetting from '@/components/ui/AppSetting.vue'
import { RenderStatus, TimelapseLastFrame, TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: {
    AppSetting,
    AppSlider,
    CollapsableCard,
    FileSystem
  }
})
export default class StatusCard extends Mixins(StateMixin) {
  saveFrames () {
    SocketActions.machineTimelapseSaveFrames(this.waits.onTimelapseSaveFrame)
  }

  get savingFrames () {
    return this.hasWait(this.waits.onTimelapseSaveFrame)
  }

  get previewUrl () {
    const url = new URL(this.apiUrl ?? document.location.origin)

    if (this.renderStatus?.status === 'success' && this.renderStatus.previewImage) {
      const file = this.renderStatus.previewImage
      url.pathname = `/server/files/timelapse/${file}`
    } else if (this.lastFrame && this.lastFrame?.file) {
      const file = this.lastFrame?.file
      url.pathname = `/server/files/timelapse_frames/${file}`
    } else {
      return
    }

    return url.toString()
  }

  get isRendering () {
    return this.renderStatus?.status === 'running'
  }

  get frameCount () {
    return this.lastFrame?.count
  }

  get lengthEstimate () {
    let framerate
    if (this.settings.variable_fps) {
      framerate = Math.min(
        this.settings.variable_fps_max,
        Math.max(
          this.settings.variable_fps_min,
          (this.frameCount || 0) / this.settings.targetlength)
      )
    } else {
      framerate = this.settings.output_framerate
    }

    const seconds = (this.frameCount || 0) / framerate
    const minutes = Math.floor(seconds / 60)

    return `${minutes ? (minutes + 'm') : ''} ${Math.floor(seconds % 60)}s`.trim()
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

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }
}
</script>

<style>
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
