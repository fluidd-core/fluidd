<template>
  <v-menu
    bottom
    left
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        fab small text
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          $menu
        </v-icon>
      </v-btn>
    </template>

    <v-list
      dense
      color="tertiary">
      <v-list-item
        v-if="!readonly"
        :disabled="disabled"
        @click="emulateClick(false)">
        <v-list-item-title>
          <v-icon small left>$fileUpload</v-icon>
          Upload
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="!readonly && root === 'gcodes'"
        :disabled="disabled"
        @click="emulateClick(true)">
        <v-list-item-title>
          <v-icon small left>$progressUpload</v-icon>
          Upload &amp; Print
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="!readonly"
        :disabled="disabled"
        @click="$emit('add-file')">
        <v-list-item-title>
          <v-icon small left>$fileAdd</v-icon>
          Add file
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="!readonly"
        :disabled="disabled"
        @click="$emit('add-dir')">
        <v-list-item-title>
          <v-icon small left>$folderAdd</v-icon>
          Add folder
        </v-list-item-title>
      </v-list-item>
    </v-list>
    <input
      type="file"
      ref="uploadFile"
      :id="`${_uid}BtnFileUpload`"
      :accept="accepts"
      style="display: none"
      @change="fileChanged"
    >
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class FileSystemMenu extends Vue {
  @Prop({ type: String, required: true })
  root!: string

  // If the controls are disabled or not.
  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  andPrint = false

  get readonly () {
    return this.$store.getters['files/getRootProperties'](this.root).readonly
  }

  get accepts () {
    return this.$store.getters['files/getRootProperties'](this.root).accepts.join(',')
  }

  emulateClick (startPrint: boolean) {
    this.andPrint = startPrint
    const uploadFile = this.$refs.uploadFile as HTMLInputElement
    uploadFile.multiple = !startPrint // Can't start print with multiple files
    uploadFile.click()
  }

  fileChanged (e: Event) {
    const target = e.target as HTMLInputElement
    const files = target.files

    if (target && files && files.length > 0) {
      this.$emit('upload', files, this.andPrint)
      target.value = ''
    }
  }
}
</script>
