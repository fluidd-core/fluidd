<template>
  <v-dialog
    v-model="file.open"
    :width="width"
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
            controls
          >
            <source
              :src="file.src"
              :type="file.type"
            >
          </video>

          <img
            v-else-if="isImage"
            :src="file.src"
          >

          <div v-else>
            {{ (file.appFile ? `.${file.appFile.extension.toUpperCase()} files` : file.filename) }}
            cannot currently be previewed.
          </div>
        </v-layout>
      </v-card-text>

      <template v-if="file.appFile && (removable || downloadable)">
        <v-divider />

        <v-card-actions class="pt-4">
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
      </template>
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
  readonly value!: boolean

  @Prop({ type: Object })
  readonly file?: FilePreviewState

  @Prop({ type: Boolean, default: false })
  readonly downloadable!: boolean

  @Prop({ type: Boolean, default: false })
  readonly removable!: boolean

  get width () {
    const defaultWidth = window.innerWidth * (this.$vuetify.breakpoint.mdAndDown ? 1 : 0.75)
    return Math.min(window.innerWidth * 0.9, Math.max(this.file?.width ?? defaultWidth, defaultWidth / 2))
  }

  get isVideo () {
    return this.file?.type.startsWith('video/')
  }

  get isImage () {
    return this.file?.type === 'image'
  }
}
</script>

<style lang="scss" scoped>
video, img {
  max-width: 100%;
  max-height: calc(90vh - (24px + 16px + 8px) * 2);
}
</style>
