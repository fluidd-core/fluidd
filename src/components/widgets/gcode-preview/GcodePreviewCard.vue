<template>
  <collapsable-card
    :title="cardTitle"
    icon="$cubeScan"
    cardClasses="mb-2 mb-sm-4 d-flex flex-column"
    contentClasses="flex-grow-1 flow-shrink-0"
    layout-path="dashboard.gcode-preview-card"
    draggable
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">

    <template v-slot:title>
      <v-icon left>$cubeScan</v-icon>
      <span class="font-weight-light">{{ cardTitle }}</span>
    </template>

    <v-card-text>
      <v-row>
        <v-col>
          <app-slider
            label="Layer nr"
            :value="currentLayer + 1"
            :min="1"
            :max="layerCount"
            :disabled="layerCount === 0"
            instant
            input-md
            @input="currentLayer = $event - 1">
          </app-slider>
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <app-slider
            label="Progress"
            :value="moveProgress - currentLayerMoveRange[0]"
            :min="0"
            :max="currentLayerMoveRange[1] - currentLayerMoveRange[0]"
            :disabled="currentLayerMoveRange[0] === currentLayerMoveRange[1]"
            valueSuffix="moves"
            instant
            input-md
            @input="moveProgress = $event + currentLayerMoveRange[0]">
          </app-slider>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="8">
          <gcode-preview width="100%" :layer="currentLayer" :progress="moveProgress"
                         :enabled="layerCount > 0"></gcode-preview>
        </v-col>
        <v-col cols="4">
          <p>{{ layerCount }} Layers</p>
          <p>Current Layer: {{ currentLayer }}({{ currentLayerHeight }})</p>
          <GcodePreviewControls/>
        </v-col>
      </v-row>
    </v-card-text>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import GcodePreview from './GcodePreview.vue'
import GcodePreviewControls from '@/components/widgets/gcode-preview/GcodePreviewControls.vue'
import { AppFile } from '@/store/files/types'

@Component({
  components: {
    GcodePreview,
    GcodePreviewControls
  }
})
export default class GcodePreviewCard extends Mixins(StateMixin, FilesMixin) {
  @Prop({
    type: Boolean,
    default: true
  })
  enabled!: boolean

  currentLayer = 1
  moveProgress = 0

  @Watch('layerCount')
  onLayerCountChanged () {
    this.currentLayer = 1
  }

  @Watch('followProgress')
  onFollowProgressChanged () {
    if (this.followProgress) {
      this.currentLayer = this.findLayerNumber(this.$store.getters['gcodePreview/getCurrentLayer'])
      this.syncMoveProgress()
    }
  }

  @Watch('currentLayer')
  onCurrentLayerChanged () {
    if (this.followProgress && this.currentLayer !== this.findLayerNumber(this.$store.getters['gcodePreview/getCurrentLayer'])) {
      this.followProgress = false
    }

    if (!this.followProgress) {
      this.moveProgress = this.currentLayerMoveRange[1]
    }
  }

  @Watch('filePosition')
  onFilePositionChanged () {
    if (this.followProgress) {
      this.syncMoveProgress()

      const moves = this.$store.getters['gcodePreview/getMoves']
      const [min, max] = this.currentLayerMoveRange

      if (this.filePosition < moves[min].filePosition || this.filePosition > moves[max].filePosition) {
        this.currentLayer = this.findLayerNumber(this.$store.getters['gcodePreview/getCurrentLayer'])
      }
    }
  }

  @Watch('moveProgress')
  onMoveProgressChanged () {
    if (this.followProgress) {
      const fileMovePosition = this.$store.getters['gcodePreview/getMoveIndexByFilePosition'](this.filePosition)

      if (fileMovePosition !== this.moveProgress) {
        this.followProgress = false
      }
    }
  }

  get file (): AppFile | undefined {
    return this.$store.getters['gcodePreview/getFile']
  }

  get filePosition (): number {
    return this.$store.state.printer.printer.virtual_sdcard.file_position
  }

  get cardTitle () {
    const title = this.$t('app.general.title.gcode_preview')

    if (!this.file) {
      return title
    }

    return `${title} - ${this.file.name}`
  }

  get layerCount () {
    return this.$store.getters['gcodePreview/getLayerCount']
  }

  get currentLayerHeight () {
    return this.$store.getters['gcodePreview/getLayers'][this.currentLayer - 1]?.z ?? 0
  }

  get followProgress () {
    return this.$store.getters['gcodePreview/getViewerOption']('followProgress')
  }

  set followProgress (value) {
    this.$store.commit('gcodePreview/setViewerState', { followProgress: value })
  }

  get currentLayerMoveRange (): [number, number] {
    const moves = this.$store.getters['gcodePreview/getMoves']

    if (moves.length === 0) {
      return [0, 0]
    }

    const layers = this.$store.getters['gcodePreview/getLayers']

    return [
      layers[this.currentLayer].move,
      layers[this.currentLayer + 1]?.move ?? moves.length - 1
    ]
  }

  findLayerNumber (layer: number) {
    const layers = this.$store.getters['gcodePreview/getLayers']

    return layers.findIndex((value: { z: number }) => value.z === layer) + 1
  }

  syncMoveProgress () {
    this.moveProgress = this.$store.getters['gcodePreview/getMoveIndexByFilePosition'](this.filePosition)
  }
}
</script>
