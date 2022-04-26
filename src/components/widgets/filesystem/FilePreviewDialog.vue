<template>
  <v-dialog
    v-model="file.open"
    :max-width="width"
  >
    <v-card v-if="file.open">
      <v-card-title class="card-heading py-2">
        <span class="focus--text">{{ file.filename }}</span>

        <v-spacer />
        <app-btn
          color=""
          icon
          @click="$emit('close')"
        >
          <v-icon>$close</v-icon>
        </app-btn>
      </v-card-title>

      <v-card-text class="py-4">
        <v-layout justify-center>
          <video
            v-if="isVideo"
            class="video-preview"
            controls
          >
            <source
              :src="file.src"
              :type="file.type"
            >
          </video>

          <div v-else>
            {{ (file.appFile ? `.${file.appFile.extension.toUpperCase()} files` : file.filename) }}
            cannot currently be previewed.
          </div>
        </v-layout>
      </v-card-text>

      <v-divider />

      <v-card-actions
        v-if="file.appFile && (removable || downloadable)"
        class="pt-4"
      >
        <v-spacer />
        <app-btn
          v-if="file.appFile && removable"
          text
          color="error"
          @click="$emit('remove', file.appFile, () => $emit('close'))"
        >
          <v-icon>$delete</v-icon>
          {{ $t('app.general.btn.remove') }}
        </app-btn>
        <app-btn
          v-if="file.appFile && downloadable"
          color="primary"
          @click="$emit('download', file.appFile)"
        >
          <v-icon>$download</v-icon>
          {{ $t('app.general.btn.download') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { FilePreviewState } from '@/store/files/types'

@Component({})
export default class FilePreviewDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean;

  @Prop({ type: Object })
  file?: FilePreviewState;

  @Prop({ type: Boolean, default: false })
  downloadable!: boolean;

  @Prop({ type: Boolean, default: false })
  removable!: boolean

  get icon () {
    if (this.isVideo) {
      return 'video'
    } else {
      return 'file'
    }
  }

  get width () {
    return window.innerWidth * (this.$vuetify.breakpoint.mdAndDown ? 1 : 0.5)
  }

  get isVideo () {
    return this.file?.type.startsWith('video/')
  }
}
</script>

<style lang="scss" scoped>
.video-preview {
  max-width: 100%;
  max-height: 100%;
}
</style>
