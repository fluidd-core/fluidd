<template>
  <div class="btn-file-upload">
    <input
      type="file"
      ref="uploadFile"
      :id="`${_uid}BtnFileUpload`"
      :label="label"
      :accept="accept"
      :icon="icon"
      style="display: none"
      @change="fileChanged"
    >
    <v-btn small :color="color" @click="$refs.uploadFile.click()"><v-icon small v-if="icon">{{ icon }}</v-icon>{{ label }}</v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class BtnFileUpload extends Vue {
  @Prop({ type: String, required: false })
  public label!: string

  @Prop({ type: String, required: false })
  public accept!: string

  @Prop({ type: String, required: false })
  public icon!: string

  @Prop({ type: String, required: false })
  public classes!: string

  @Prop({ type: String, required: false })
  public color!: string

  fileChanged (e: Event) {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (target && files && files.length > 0) {
      this.$emit('file-update', files[0])
      const uploadFile = this.$refs.uploadFile as HTMLInputElement
      uploadFile.value = ''
    }
  }
}
</script>

<style lang="scss">
</style>
