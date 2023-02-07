<template>
  <app-dialog
    v-model="file.open"
    :title="file.filename"
    :width="width"
    no-actions
  >
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
          {{ $t('app.general.simple_form.msg.no_file_preview', { name: (file.appFile ? `.${file.appFile.extension.toUpperCase()} files` : file.filename) }) }}
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
          @click="$emit('remove', file.appFile, () => file.open = false)"
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
  </app-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { FilePreviewState } from '@/store/files/types'

@Component({})
export default class FilePreviewDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  readonly value!: boolean

  @Prop({ type: Object, required: true })
  readonly file!: FilePreviewState

  @Prop({ type: Boolean, default: false })
  readonly downloadable!: boolean

  @Prop({ type: Boolean, default: false })
  readonly removable!: boolean

  get width () {
    const defaultWidth = window.innerWidth * (this.$vuetify.breakpoint.mdAndDown ? 1 : 0.75)
    return Math.min(window.innerWidth * 0.9, Math.max(this.file.width ?? defaultWidth, defaultWidth / 2))
  }

  get isVideo () {
    return this.file.type.startsWith('video/')
  }

  get isImage () {
    return this.file.type === 'image'
  }
}
</script>

<style lang="scss" scoped>
video, img {
  max-width: 100%;
  max-height: calc(90vh - (24px + 16px + 8px) * 2);
}
</style>
