<template>
  <v-dialog
    :value="value"
    :width="width"
    persistent
  >
    <v-card v-if="file.open">
      <v-card-title class="card-heading py-2 px-5">
        <v-col cols="11">
          <v-icon left>
            $file
          </v-icon>
          <span class="focus--text">
            {{ file.filename }}
          </span>
        </v-col>

        <v-col
          class="text-right"
          cols="1"
        >
          <v-icon @click="$emit('close')">
            $close
          </v-icon>
        </v-col>
      </v-card-title>

      <v-card-text class="pt-5">
        <video
          v-if="file.type.startsWith('video/')"
          class="video-preview"
          controls
        >
          <source
            :src="file.src"
            :type="file.type"
          >
        </video>
      </v-card-text>

      <v-card-actions class="py-2 px-5">
        <v-spacer />
        <app-btn
          text
          color=""
          @click="$emit('close')"
        >
          {{ $t('app.general.btn.close') }}
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

  get width () {
    return window.innerWidth * 0.5
  }
}
</script>

<style>
.video-preview {
  max-width: 100%;
  max-height: 100%;
}
</style>
