<template>
  <app-dialog
    v-model="open"
    :title="$t('app.afc.PrintStartDialog.Title')"
    width="600"
    :save-button-text="$t('app.general.btn.print')"
    @save="handlePrint"
  >
    <!-- Thumbnail preview -->
    <div
      v-if="thumbnailUrl"
      class="d-flex align-center justify-center thumbnail-container"
    >
      <v-img
        :src="thumbnailUrl"
        :max-width="thumbnailWidth"
        contain
        class="thumbnail-preview"
      />
    </div>

    <!-- Filename subtitle -->
    <v-card-title class="text-h5">
      {{ $t('app.afc.PrintStartDialog.StartJob') }}
    </v-card-title>
    <v-card-text class="pb-1 pt-3 px-4">
      <span class="text-body-2 text--secondary text-truncate d-block">
        {{ question }}
      </span>
    </v-card-text>

    <v-divider />

    <!-- Tool rows -->
    <v-card-text class="pa-0">
      <afc-print-start-dialog-tool
        v-for="(toolIndex, index) in usedTools"
        :key="toolIndex"
        :file="currentFile"
        :tool-index="toolIndex"
        :class="{ 'border-top': index > 0 }"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import FilesMixin from '@/mixins/files'
import { SocketActions } from '@/api/socketActions'
import getFilePaths from '@/util/get-file-paths'
import type { AppFileWithMeta } from '@/store/files/types'
@Component({
  components: {
    AfcPrintStartDialogTool: () => import('./AfcPrintStartDialogTool.vue')
  }
})
export default class AfcPrintStartDialog extends Mixins(StateMixin, AfcMixin, FilesMixin) {
  get open (): boolean {
    return this.$typedState.afc.dialog.show
  }

  set open (val: boolean) {
    this.$typedCommit('afc/setDialogState', {
      ...this.$typedState.afc.dialog,
      show: val
    })
  }

  get filename (): string | undefined {
    return this.$typedState.afc.dialog.filename
  }

  get currentFile (): AppFileWithMeta | undefined {
    if (!this.filename) return undefined

    const { filename, rootPath } = getFilePaths(this.filename, 'gcodes')
    return this.$typedGetters['files/getFile'](rootPath, filename)
  }

  get shortFilename (): string {
    if (!this.filename) return ''
    return getFilePaths(this.filename, 'gcodes').filename
  }

  get activeSpool () {
    return this.$typedGetters['spoolman/getActiveSpool']
  }

  get question (): string {
    if (this.activeSpool) {
      return this.$t('app.afc.PrintStartDialog.QuestionWithSpool', {
        filename: this.shortFilename
      }).toString()
    }

    return this.$t('app.afc.PrintStartDialog.Question', {
      filename: this.shortFilename
    }).toString()
  }

  get thumbnailUrl (): string {
    if (!this.currentFile || !this.filename) return ''

    const { path } = getFilePaths(this.filename, 'gcodes')
    return this.getThumbUrl(this.currentFile, 'gcodes', path, true, this.currentFile.modified)
  }

  get thumbnailWidth (): number {
    const thumb = this.currentFile?.thumbnails?.reduce((a, b) => (a.size > b.size ? a : b))
    return thumb?.width ?? 400
  }

  get usedTools (): number[] {
    const filamentWeights: number[] = this.currentFile?.filament_weights ?? []

    return filamentWeights.reduce<number[]>((tools, weight, index) => {
      if (weight > 0) tools.push(index)
      return tools
    }, [])
  }

  handlePrint () {
    if (this.filename) {
      SocketActions.printerPrintStart(this.filename)

      if (this.$route.name !== 'home') {
        this.$router.push({ name: 'home' })
      }
    }
    this.open = false
  }

  @Watch('open')
  onOpenChange (val: boolean) {
    if (val && this.filename && this.currentFile == null) {
      SocketActions.serverFilesMetadata(this.filename)
    }
  }
}
</script>

<style scoped>
.thumbnail-container {
  background-color: rgba(0, 0, 0, 0.6);
  max-height: 250px;
  overflow: hidden;
}

.thumbnail-preview {
  max-height: 250px;
}

.border-top {
  border-top: thin solid rgba(255, 255, 255, 0.12);
}

.v-application.theme--light .border-top {
  border-top: thin solid rgba(0, 0, 0, 0.12);
}
</style>
