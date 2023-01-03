<template>
  <div>
    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <app-btn
          fab
          small
          :elevation="0"
          class="mr-1 bg-transparent"
          color="transparent"
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
import { Component, Vue, Ref, Prop } from 'vue-property-decorator'

@Component({})
export default class AppUploadAndPrintBtn extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  @Ref('uploadFile')
  readonly uploadFile!: HTMLInputElement

  get accepts () {
    return this.$store.getters['files/getRootProperties']('gcodes').accepts.join(',')
  }

  fileChanged (e: Event) {
    const target = e.target as HTMLInputElement

    if (target?.files?.length === 1) {
      this.$emit('upload', target.files[0])
      target.value = ''
    }
  }
}
</script>
<style lang="scss" scoped>
  .v-btn.v-btn--disabled.v-btn--has-bg.bg-transparent {
    background: none !important;
  }
</style>
