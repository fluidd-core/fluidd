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

    <template #actions>
      <app-btn
        text
        color="primary"
        type="button"
        @click="handleAutoMap"
      >
        {{ $t('app.afc.PrintStartDialog.AutoMap') }}
      </app-btn>

      <v-spacer />

      <app-btn
        text
        color="warning"
        type="button"
        @click="open = false"
      >
        {{ $t('app.general.btn.cancel') }}
      </app-btn>
      <app-btn
        color="primary"
        type="submit"
      >
        {{ $t('app.general.btn.print') }}
      </app-btn>
    </template>
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
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import { TinyColor } from '@ctrl/tinycolor'

// sRGB hex -> CIE Lab (D65), used for perceptual color distance
const hexToLab = (hex: string): [number, number, number] => {
  const { r, g, b } = new TinyColor(hex).toRgb()
  const lin = (c: number) => (c /= 255) > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92
  const [lr, lg, lb] = [lin(r), lin(g), lin(b)]
  const f = (t: number) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
  const x = f((lr * 0.4124 + lg * 0.3576 + lb * 0.1805) / 0.95047)
  const y = f(lr * 0.2126 + lg * 0.7152 + lb * 0.0722)
  const z = f((lr * 0.0193 + lg * 0.1192 + lb * 0.9505) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}
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

  // Map each used tool to the closest loaded lane: same material first, then by color.
  // Lanes are assigned once, so the resulting SET_MAP sequence is order independent.
  handleAutoMap () {
    const file = this.currentFile
    if (!file) return

    const lanes = this.afcLanes
      .map(lane => ({ lane, info: this.getAfcLaneInfo(lane) }))
      .filter(({ info }) => info.filamentLoaded && info.color)

    const pairs = this.usedTools.flatMap(tool => {
      const color = file.filament_colors?.[tool]
      if (!color) return []
      const material = (file.filament_type?.[tool] ?? '').toLowerCase()
      const [l1, a1, b1] = hexToLab(color)

      return lanes.map(({ lane, info }) => {
        const [l2, a2, b2] = hexToLab(info.color)
        const mismatch = material && !info.material.toLowerCase().includes(material) ? 1 : 0
        return { tool, lane, mismatch, distance: Math.hypot(l1 - l2, a1 - a2, b1 - b2) }
      })
    }).sort((a, b) => a.mismatch - b.mismatch || a.distance - b.distance)

    const usedLanes = new Set<string>()
    const mapped = new Set<number>()
    const gcode: string[] = []

    for (const { tool, lane } of pairs) {
      if (mapped.has(tool) || usedLanes.has(lane)) continue
      mapped.add(tool)
      usedLanes.add(lane)

      const map = this.getAfcLaneObject(lane)?.map
      const toolName = `T${tool}`
      if (!(Array.isArray(map) ? map : [map]).some(t => t?.toLowerCase() === toolName.toLowerCase())) {
        gcode.push(`SET_MAP LANE=${encodeGcodeParamValue(lane)} MAP=${encodeGcodeParamValue(toolName)}`)
      }
    }

    if (gcode.length) {
      this.sendGcode(gcode.join('\n'))
    }
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
