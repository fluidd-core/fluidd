<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        :disabled="disabled"
        fab
        small
        text
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          $plus
        </v-icon>
      </v-btn>
    </template>

    <v-list
      dense
    >
      <v-list-item
        v-if="!readonly"
        :disabled="disabled"
        @click="emulateClick(false)"
      >
        <v-list-item-title>
          <v-icon
            small
            left
          >
            $fileUpload
          </v-icon>
          {{ $t('app.general.btn.upload') }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="!readonly && root === 'gcodes'"
        :disabled="disabled"
        @click="emulateClick(true)"
      >
        <v-list-item-title>
          <v-icon
            small
            left
          >
            $progressUpload
          </v-icon>
          {{ $t('app.general.btn.upload_print') }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="!readonly"
        :disabled="disabled"
        @click="$emit('add-file')"
      >
        <v-list-item-title>
          <v-icon
            small
            left
          >
            $fileAdd
          </v-icon>
          {{ $t('app.general.btn.add_file') }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-if="!readonly || canCreateDirectory"
        :disabled="disabled"
        @click="$emit('add-dir')"
      >
        <v-list-item-title>
          <v-icon
            small
            left
          >
            $folderAdd
          </v-icon>
          {{ $t('app.general.btn.add_dir') }}
        </v-list-item-title>
      </v-list-item>
    </v-list>
    <input
      ref="uploadFile"
      type="file"
      :accept="accepts"
      style="display: none"
      multiple
      @change="fileChanged"
    >
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator'

@Component({})
export default class FileSystemMenu extends Vue {
  @Prop({ type: String, required: true })
  root!: string

  // If the controls are disabled or not.
  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  @Ref('uploadFile')
  readonly uploadFile!: HTMLInputElement

  andPrint = false

  get readonly () {
    return this.$store.getters['files/getRootProperties'](this.root).readonly
  }

  get accepts () {
    return this.$store.getters['files/getRootProperties'](this.root).accepts.join(',')
  }

  get canCreateDirectory () {
    return this.$store.getters['files/getRootProperties'](this.root).canCreateDirectory
  }

  emulateClick (startPrint: boolean) {
    this.andPrint = startPrint
    this.uploadFile.multiple = !startPrint // Can't start print with multiple files
    this.uploadFile.click()
  }

  fileChanged (e: Event) {
    const target = e.target as HTMLInputElement
    const files = target.files
    const fileList = []

    if (target && files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        fileList.push(files[i])
      }

      this.$emit('upload', fileList, this.andPrint)
      target.value = ''
    }
  }
}
</script>
