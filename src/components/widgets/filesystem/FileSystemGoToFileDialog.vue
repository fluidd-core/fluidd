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
    <v-card-text>
      <v-simple-table>
        <tbody>
          <template v-for="file in matchedFiles">
            <tr
              :key="file.path"
              @click="handleFileClick(file)"
            >
              <td>{{ file.path }}</td>
            </tr>
          </template>
        </tbody>
      </v-simple-table>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel, Watch } from 'vue-property-decorator'
import { SocketActions } from '@/api/socketActions'
import { RootFile } from '@/store/files/types'
import getFilePaths from '@/util/get-file-paths'
import StateMixin from '@/mixins/state'

type File = RootFile &{
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

  get rootFiles (): RootFile[] {
    return this.$store.getters['files/getRootFiles'](this.root) as RootFile[]
  }

  get matchedRootFiles (): RootFile[] {
    if (!this.loaded) {
      return []
    }

    const search = this.search
      .split('')
      .join('.*')
    const searchRegExp = new RegExp(search, 'i')

    return this.rootFiles
      .filter(rootFile => searchRegExp.exec(rootFile.path))
  }

  get matchedFiles () {
    return this.matchedRootFiles
      .slice(0, 100)
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
    return this.hasWait(`${this.$waits.onFileSystem}${this.root}`) as boolean
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

<style lang="scss" scoped>
:deep(.v-data-table td) {
  cursor: pointer;
  user-select: none;
}
</style>
