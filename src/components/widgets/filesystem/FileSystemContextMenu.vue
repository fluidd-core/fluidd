<template>
  <v-menu
    v-model="open"
    transition="slide-y-transition"
    :position-x="positionX"
    :position-y="positionY"
    min-width="180"
    absolute
    right
  >
    <v-card>
      <v-row
        align="center"
        justify="center"
        no-gutters
      >
        <v-col>
          <v-list dense>
            <v-list-item
              v-if="canPrint"
              link
              :disabled="!printerReady"
              @click="$emit('print', file)"
            >
              <v-list-item-icon>
                <v-icon :disabled="!printerReady">
                  $printer
                </v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.print') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="canPrint && supportsJobQueue"
              link
              @click="$emit('enqueue', file)"
            >
              <v-list-item-icon>
                <v-icon>$enqueueJob</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t("app.general.btn.add_to_queue") }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="canPreheat"
              link
              :disabled="!printerReady"
              @click="$emit('preheat', file)"
            >
              <v-list-item-icon>
                <v-icon :disabled="!printerReady">
                  $fire
                </v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.preheat') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="file.type !== 'directory' && rootProperties.canEdit"
              link
              @click="$emit('edit', file)"
            >
              <v-list-item-icon>
                <v-icon>$pencil</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.edit') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="file.type !== 'directory' && rootProperties.canView"
              link
              @click="$emit('view', file)"
            >
              <v-list-item-icon>
                <v-icon>$magnify</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.view') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="file.type !== 'directory'"
              link
              @click="$emit('download', file)"
            >
              <v-list-item-icon>
                <v-icon>$download</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.download') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="file.type !== 'directory' && canPreviewGcode"
              link
              @click="$emit('preview-gcode', file)"
            >
              <v-list-item-icon>
                <v-icon>$magnify</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.preview_gcode') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="!rootProperties.readonly"
              link
              @click="$emit('rename', file)"
            >
              <v-list-item-icon>
                <v-icon>$rename</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.rename') }}</v-list-item-title>
            </v-list-item>
            <v-list-item
              v-if="!rootProperties.readonly || rootProperties.canDelete"
              link
              @click="$emit('remove', file)"
            >
              <v-list-item-icon>
                <v-icon>$delete</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t('app.general.btn.remove') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-col>
        <v-col
          v-if="'thumbnails' in file && file.thumbnails && file.thumbnails.length"
          class="px-2 d-none d-sm-flex"
        >
          <v-btn
            text
            height="100%"
            @click="$emit('view-thumbnail', file)"
          >
            <img
              class="mx-2"
              :src="getThumbUrl(file.thumbnails, file.path, true, file.modified)"
              :height="150"
            >
          </v-btn>
        </v-col>
      </v-row>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import StateMixin from '@/mixins/state'
import { AppDirectory, AppFile, AppFileWithMeta } from '@/store/files/types'

/**
 * NOTE: Generally, moonraker expects the paths to include the root.
 */
@Component({})
export default class FileSystemContextMenu extends Mixins(StateMixin, FilesMixin) {
  @VModel({ type: Boolean, default: false })
    open!: boolean

  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: Object, required: true })
  readonly file!: AppDirectory | AppFile | AppFileWithMeta

  @Prop({ type: Number, required: true })
  readonly positionX!: number

  @Prop({ type: Number, required: true })
  readonly positionY!: number

  get rootProperties () {
    return this.$store.getters['files/getRootProperties'](this.root)
  }

  get canPrint () {
    return (
      this.file.type !== 'directory' &&
      this.rootProperties.accepts.includes('.' + this.file.extension) &&
      this.rootProperties.canPrint
    )
  }

  get canPreheat () {
    return (
      'first_layer_extr_temp' in this.file &&
      'first_layer_bed_temp' in this.file
    )
  }

  get printerReady () {
    return (
      !this.printerPrinting &&
      !this.printerPaused &&
      this.klippyReady
    )
  }

  get canPreviewGcode () {
    return (
      this.file.type === 'file' &&
      this.file.extension === 'gcode' &&
      this.root === 'gcodes'
    )
  }

  get supportsJobQueue (): boolean {
    return this.$store.getters['server/componentSupport']('job_queue')
  }
}
</script>
