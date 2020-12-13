<template>
  <div>
    <v-btn-toggle v-if="!readonly">
      <v-tooltip dense top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            max-width="42"
            small
            v-bind="attrs"
            v-on="on"
            color="secondary"
            @click="$emit('folder-add')">
            <v-icon small>$folderAdd</v-icon>
          </v-btn>
        </template>
        <span>Add Folder</span>
      </v-tooltip>

      <v-tooltip dense top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-if="fileCreate"
            max-width="42"
            small
            v-bind="attrs"
            v-on="on"
            color="secondary"
            @click="$emit('file-add')">
            <v-icon small>$fileAdd</v-icon>
          </v-btn>
        </template>
        <span>Create File</span>
      </v-tooltip>

      <v-tooltip dense top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            max-width="42"
            small
            color="secondary"
            v-bind="attrs"
            v-on="on"
            :loading="uploadLoading"
            @click="andPrint = false; $refs.uploadFile.click()">
            <v-icon small>$fileUpload</v-icon>
          </v-btn>
        </template>
        <span>Upload</span>
      </v-tooltip>

      <v-tooltip dense top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            v-if="uploadAndPrint"
            max-width="42"
            small
            color="secondary"
            v-bind="attrs"
            v-on="on"
            :loading="uploadLoading"
            @click="andPrint = true; $refs.uploadFile.click()">
            <v-icon small>$progressUpload</v-icon>
          </v-btn>
        </template>
        <span>Upload &amp; Print</span>
      </v-tooltip>

      <input
        type="file"
        ref="uploadFile"
        :id="`${_uid}BtnFileUpload`"
        :accept="accept"
        style="display: none"
        @change="fileChanged"
      >

      <v-tooltip dense top>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            max-width="42"
            small
            color="secondary"
            v-bind="attrs"
            v-on="on"
            @click="$emit('refresh')">
            <v-icon small>$refresh</v-icon>
          </v-btn>
        </template>
        <span>Refresh</span>
      </v-tooltip>
    </v-btn-toggle>

    <v-tooltip dense top v-if="readonly">
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          max-width="42"
          small
          v-bind="attrs"
          v-on="on"
          color="secondary"
          @click="$emit('refresh')">
          <v-icon small>$refresh</v-icon>
        </v-btn>
      </template>
      <span>Refresh</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class FileSystemControls extends Vue {
  @Prop({ type: String, required: false })
  accept!: string

  @Prop({ type: String, required: false })
  classes!: string

  @Prop({ type: Boolean })
  uploadLoading!: boolean

  @Prop({ type: Boolean, default: false })
  readonly!: boolean

  @Prop({ type: Boolean, default: false })
  uploadAndPrint!: boolean

  @Prop({ type: Boolean, default: false })
  fileCreate!: boolean

  andPrint = false

  fileChanged (e: Event) {
    const target = e.target as HTMLInputElement
    const files = target.files
    if (target && files && files.length > 0) {
      this.$emit('upload', files[0], this.andPrint)
      const uploadFile = this.$refs.uploadFile as HTMLInputElement
      uploadFile.value = ''
    }
  }
}
</script>

<style lang="scss">

</style>
