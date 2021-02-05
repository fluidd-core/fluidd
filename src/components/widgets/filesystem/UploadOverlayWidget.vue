<template>
  <v-overlay
    class="uploadOverlay"
    :value="value"
    :opacity="0.85"
    absolute
  >
    <v-container>
      <v-row
        class="fill-height"
        align-content="center"
        justify="center"
        no-gutters>
        <v-col
          class="text-h6 font-weight-light text-center"
          cols="6">
          <v-icon x-large>$fileUpload</v-icon>
          <span><strong>{{$t('Uploading')}}</strong> {{$t('files')}}</span>
        </v-col>
      </v-row>
      <v-row
        v-for="file in files"
        :key="file.filename"
        justify="center">
        <template v-if="!file.processingComplete">
          <v-col cols="6" class="font-weight-light mb-1">
            <div class="mb-1">{{ file.filename }}</div>
            <div v-if="file.percentComplete < 100">
              <small>{{$t('Uploading')}}...</small>
              <v-progress-linear
                class="mt-1"
                :height="20"
                color="primary"
                :value="file.percentComplete">
                <small>{{ file.percentComplete }}%</small>
              </v-progress-linear>
            </div>
            <div v-if="file.percentComplete >= 100">
              <small>{{$t('Processing')}}...</small>
              <v-progress-linear
                class="mt-1"
                color="primary"
                indeterminate>
              </v-progress-linear>
            </div>
          </v-col>
        </template>
      </v-row>
    </v-container>
  </v-overlay>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { FilesUpload } from '@/store/files/types'

@Component({})
export default class UploadOverlayWidget extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean;

  @Prop({ type: Array })
  files!: FilesUpload[]
}
</script>

<style lang="scss" scoped>
  .uploadOverlay.v-overlay--active {
    border: dashed 3px #616161;
  }

  .uploadOverlay ::v-deep .v-overlay__content {
    width: 100%;
  }
</style>
