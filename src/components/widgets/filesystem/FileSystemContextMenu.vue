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
              :disabled="!printerReady"
              @click="$emit('print', file)"
            >
              <v-list-item-icon>
                <v-icon>
                  $printer
                </v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.print') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="canAddToQueue"
              @click="$emit('enqueue', file)"
            >
              <v-list-item-icon>
                <v-icon>$enqueueJob</v-icon>
              </v-list-item-icon>
              <v-list-item-title>{{ $t("app.general.btn.add_to_queue") }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              v-if="canPreheat"
              :disabled="!printerReady"
              @click="$emit('preheat', file)"
            >
              <v-list-item-icon>
                <v-icon>
                  $fire
                </v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.preheat') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="canView"
              @click="$emit('view', file)"
            >
              <v-list-item-icon>
                <v-icon>$open</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.view') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="canEdit"
              @click="$emit('edit', file)"
            >
              <v-list-item-icon>
                <v-icon>$pencil</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.edit') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="canPrint"
              @click="$emit('refresh-metadata', file)"
            >
              <v-list-item-icon>
                <v-icon>$sync</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.refresh_metadata') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="canPreviewGcode"
              @click="$emit('preview-gcode', file)"
            >
              <v-list-item-icon>
                <v-icon>$cubeScan</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.preview_gcode') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="canCreateZip"
              @click="$emit('create-zip', file)"
            >
              <v-list-item-icon>
                <v-icon>$fileZipAdd</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.create_zip_archive') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="!Array.isArray(file) && file.type !== 'directory'"
              @click="$emit('download', file)"
            >
              <v-list-item-icon>
                <v-icon>$download</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.download') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="!Array.isArray(file) && !rootProperties.readonly"
              @click="$emit('rename', file)"
            >
              <v-list-item-icon>
                <v-icon>$rename</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.rename') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="!Array.isArray(file) && !rootProperties.readonly"
              @click="$emit('duplicate', file)"
            >
              <v-list-item-icon>
                <v-icon>$duplicate</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.duplicate') }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>

            <v-list-item
              v-if="!rootProperties.readonly"
              @click="$emit('remove', file)"
            >
              <v-list-item-icon>
                <v-icon>$delete</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>{{ $t('app.general.btn.remove') }}</v-list-item-title>
              </v-list-item-content>
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
            class="no-pointer-events"
            @click="$emit('view-thumbnail', file)"
          >
            <img
              class="mx-2"
              :src="getThumbUrl(file, root, file.path, true, file.modified)"
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
import type { FileBrowserEntry, RootProperties } from '@/store/files/types'

/**
 * NOTE: Generally, moonraker expects the paths to include the root.
 */
@Component({})
export default class FileSystemContextMenu extends Mixins(StateMixin, FilesMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: [Object, Array], required: true })
  readonly file!: FileBrowserEntry | FileBrowserEntry[]

  @Prop({ type: Number, required: true })
  readonly positionX!: number

  @Prop({ type: Number, required: true })
  readonly positionY!: number

  get rootProperties (): RootProperties {
    return this.$store.getters['files/getRootProperties'](this.root) as RootProperties
  }

  get canPrint () {
    return (
      this.root === 'gcodes' &&
      !Array.isArray(this.file) &&
      this.file.type !== 'directory' &&
      this.rootProperties.accepts.includes(`.${this.file.extension}`)
    )
  }

  get canEdit () {
    return (
      !Array.isArray(this.file) &&
      this.file.type !== 'directory' &&
      (
        this.file.permissions === undefined ||
        this.file.permissions.includes('r')
      )
    )
  }

  get canView () {
    return (
      !Array.isArray(this.file) &&
      this.file.type !== 'directory' &&
      this.rootProperties.canView.includes(`.${this.file.extension}`) &&
      (
        this.file.permissions === undefined ||
        this.file.permissions.includes('r')
      )
    )
  }

  get canPreheat () {
    return (
      this.root === 'gcodes' &&
      !Array.isArray(this.file) &&
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
      this.root === 'gcodes' &&
      !Array.isArray(this.file) &&
      this.file.type === 'file' &&
      this.file.extension === 'gcode'
    )
  }

  get canCreateZip () {
    return (
      (
        Array.isArray(this.file) ||
        this.file.type !== 'file' ||
        this.file.extension !== 'zip'
      ) &&
      !this.rootProperties.readonly &&
      this.$store.getters['server/getIsMinApiVersion']('1.1.0')
    )
  }

  get canAddToQueue () {
    const files = Array.isArray(this.file) ? this.file : [this.file]

    return (
      this.root === 'gcodes' &&
      files.some(x =>
        x.type !== 'directory' &&
        this.rootProperties.accepts.includes('.' + x.extension)
      ) &&
      this.$store.getters['server/componentSupport']('job_queue')
    )
  }
}
</script>
