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
        <img
          :src="previewUrl"
          class="mx-auto thumbnail"
        >
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
        :disabled="!!renderStatus"
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

    if (this.renderStatus?.status === 'success') {
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

  get frameCount () {
    return this.lastFrame?.count
  }

  get lengthEstimate () {
    const seconds = (this.frameCount || 0) / this.settings.output_framerate
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
</style>
