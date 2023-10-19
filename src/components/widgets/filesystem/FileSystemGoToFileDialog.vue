<template>
  <app-dialog
    v-model="open"
    :title="$t('app.file_system.title.go_to_file')"
    no-actions
    max-width="800"
  >
    <v-card-actions>
      <v-text-field
        v-model="search"
        :loading="loading"
        outlined
        hide-details
        dense
        autofocus
        class="mx-2"
      />
    </v-card-actions>

    <v-divider />

    <v-virtual-scroll
      :items="matchedFiles"
      bench="30"
      item-height="40"
    >
      <template #default="{ item }">
        <v-list-item
          :key="item.path"
          dense
          class="v-list-item--link"
          @click="handleFileClick(item)"
        >
          <v-list-item-content>
            <v-list-item-title class="text-body-2 font-weight-regular">
              {{ item.path }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-divider />
      </template>
    </v-virtual-scroll>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel, Watch } from 'vue-property-decorator'
import { SocketActions } from '@/api/socketActions'
import type { MoonrakerRootFile } from '@/store/files/types'
import getFilePaths from '@/util/get-file-paths'
import StateMixin from '@/mixins/state'

type File = MoonrakerRootFile &{
  filename: string
  filepath: string
  rootPath: string
}

@Component({})
export default class FileSystemGoToFileDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: String, required: true })
  readonly root!: string

  search = ''
  loaded = false

  get rootFiles (): MoonrakerRootFile[] {
    return this.$store.getters['files/getRootFiles'](this.root) as MoonrakerRootFile[]
  }

  get matchedFiles (): File[] {
    if (!this.loaded) {
      return []
    }

    const search = this.search
      .split('')
      .join('.*')
    const searchRegExp = new RegExp(search, 'i')

    return this.rootFiles
      .filter(rootFile => searchRegExp.exec(rootFile.path))
      .map(rootFile => {
        const { filename, rootPath, path: filepath } = getFilePaths(rootFile.path, this.root)

        const file: File = ({
          ...rootFile,
          filename,
          filepath,
          rootPath
        })

        return file
      })
  }

  get loading (): boolean {
    return this.hasWait(`${this.$waits.onFileSystem}/${this.root}/`) as boolean
  }

  @Watch('loading')
  onLoading (value: boolean) {
    this.loaded = !value
  }

  handleFileClick (file: File) {
    this.$emit('path-change', file.rootPath)
    this.open = false
  }

  mounted () {
    this.loaded = false
    SocketActions.serverFilesListRoot(this.root)
  }
}
</script>
