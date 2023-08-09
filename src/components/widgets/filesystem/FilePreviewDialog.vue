<template>
  <app-dialog
    v-model="open"
    :title="filename"
    :width="calculatedWidth"
    no-actions
  >
    <v-card-text class="py-4">
      <v-layout justify-center>
        <video
          v-if="isVideo"
          controls
        >
          <source
            :src="src"
            :type="type"
          >
        </video>

        <img
          v-else-if="isImage"
          :src="src"
        >

        <div v-else>
          {{ $t('app.general.simple_form.msg.no_file_preview', { name: (extension ? `.${extension} files` : filename) }) }}
        </div>
      </v-layout>
    </v-card-text>

    <template v-if="file">
      <v-divider />

      <v-card-actions class="pt-4">
        <v-spacer />
        <app-btn
          v-if="!readonly"
          text
          color="error"
          @click="$emit('remove', file)"
        >
          <v-icon>$delete</v-icon>
          {{ $t('app.general.btn.remove') }}
        </app-btn>
        <app-btn
          color="primary"
          @click="$emit('download', file)"
        >
          <v-icon>$download</v-icon>
          {{ $t('app.general.btn.download') }}
        </app-btn>
      </v-card-actions>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { AppFile } from '@/store/files/types'

@Component({})
export default class FilePreviewDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean, default: false })
    open!: boolean

  @Prop({ type: Object })
  readonly file?: AppFile

  @Prop({ type: String, required: true })
  readonly filename!: string

  @Prop({ type: String, required: false })
  readonly extension?: string

  @Prop({ type: String, required: true })
  readonly src!: string

  @Prop({ type: String, required: true })
  readonly type!: string

  @Prop({ type: Number, required: false })
  readonly width?: number

  @Prop({ type: Boolean, default: false })
  readonly readonly?: boolean

  get calculatedWidth () {
    const defaultWidth = window.innerWidth * (this.$vuetify.breakpoint.mdAndDown ? 1 : 0.75)
    return Math.min(window.innerWidth * 0.9, Math.max(this.width ?? defaultWidth, defaultWidth / 2))
  }

  get isVideo () {
    return this.type.startsWith('video/')
  }

  get isImage () {
    return this.type.startsWith('image/')
  }
}
</script>

<style lang="scss" scoped>
video, img {
  max-width: 100%;
  max-height: calc(90vh - 144px);
}
</style>
