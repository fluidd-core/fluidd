<template>
  <div>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <app-btn
          icon
          text
          :disabled="disabled"
          v-bind="attrs"
          v-on="on"
          @click="uploadFile.click()"
        >
          <v-icon>
            $progressUpload
          </v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.label.upload_and_print') }}</span>
    </v-tooltip>

    <input
      ref="uploadFile"
      type="file"
      :accept="accepts"
      style="display: none"
      @change="fileChanged"
    >
  </div>
</template>

<script lang="ts">
import type { RootProperties } from '@/store/files/types'
import { Component, Vue, Ref, Prop } from 'vue-property-decorator'

@Component({})
export default class AppUploadAndPrintBtn extends Vue {
  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Ref('uploadFile')
  readonly uploadFile!: HTMLInputElement

  get rootProperties (): RootProperties {
    return this.$typedGetters['files/getRootProperties']('gcodes')
  }

  get accepts () {
    return this.rootProperties.accepts.join(',')
  }

  fileChanged (event: Event) {
    if (event.target instanceof HTMLInputElement) {
      if (event.target.files?.length === 1) {
        this.$emit('upload', event.target.files[0])
      }

      event.target.value = ''
    }
  }
}
</script>
<style lang="scss" scoped>
  .v-btn.v-btn--disabled.v-btn--has-bg.bg-transparent {
    background: none !important;
  }
</style>
