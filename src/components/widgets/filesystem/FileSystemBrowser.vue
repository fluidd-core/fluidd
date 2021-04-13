<template>
  <div class="file-system">
    <v-data-table
      mobile-breakpoint="0"
      :headers="headers"
      :items="files"
      :dense="dense"
      :disable-pagination="true"
      :loading="loading"
      :sort-desc="true"
      :custom-sort="$filters.fileSystemSort"
      :search="search"
      item-key="name"
      height="100%"
      :no-data-text="$t('app.file_system.msg.not_found')"
      :no-results-text="$t('app.file_system.msg.not_found')"
      sort-by="modified"
      hide-default-footer
      class="rounded-0"
    >

      <template v-slot:item="{ item }">
        <tr
          :class="{
            'is-directory': (item.type === 'directory'),
            'is-file': (item.type === 'file'),
            'is-disabled': disabled
          }"
          class="row-select px-1"
          @click.prevent="$emit('row-click', item, $event)"
          @contextmenu.prevent="$emit('row-click', item, $event)"

          :draggable="(item.name !== '..')"
          @drag="handleDrag(item)"
          @dragend="handleDragEnd"
          @drop.prevent.stop="handleDrop(item, $event)"
          @dragover.prevent="handleDragOver($event)"
          @dragleave.prevent="handleDragLeave($event)"
        >
          <td>
            <!-- icons are 16px small, or 24px for standard size. -->
            <v-icon
              v-if="!item.thumbnails || !item.thumbnails.length"
              :small="dense"
              :color="(item.type === 'file') ? 'grey' : 'primary'">
              {{ (item.type === 'file' ? '$file' : item.name === '..' ? '$folderUp' : '$folder') }}
            </v-icon>
            <img
              v-if="item.thumbnails && item.thumbnails.length"
              class="file-icon-thumb"
              :src="getThumbUrl(item.thumbnails, item.path)"
              :width="(dense) ? 16 : 24"
            />
          </td>

          <file-row-item :nowrap="false">
            {{ item.name }}
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="object_height">
            <span v-if="item.object_height !== undefined">
              {{ $filters.getReadableLengthString(item.object_height) }}
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="first_layer_height">
            <span v-if="item.first_layer_height !== undefined">
              {{ item.first_layer_height }} mm
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="layer_height">
            <span v-if="item.layer_height !== undefined">
              {{ item.layer_height }} mm
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="filament_total">
            <span v-if="item.filament_total !== undefined">
              {{ $filters.getReadableLengthString(item.filament_total) }}
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="history.filament_used">
            <span v-if="item.history && item.history.filament_used !== undefined">
              {{ $filters.getReadableLengthString(item.history.filament_used) }}
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="slicer">
            <span v-if="item.slicer !== undefined">
              {{ item.slicer }}
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="slicer_version">
            <span v-if="item.slicer_version !== undefined">
              {{ item.slicer_version }}
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="estimated_time">
            <span v-if="item.estimated_time !== undefined">
              {{ $filters.formatCounterTime(item.estimated_time) }}
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="history.print_duration">
            <span v-if="item.history && item.history.print_duration !== undefined">
              {{ $filters.formatCounterTime(item.history.print_duration) }}
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="history.total_duration">
            <span v-if="item.history && item.history.total_duration !== undefined">
              {{ $filters.formatCounterTime(item.history.total_duration) }}
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="first_layer_bed_temp">
            <span v-if="item.first_layer_bed_temp !== undefined">
              {{ item.first_layer_bed_temp }}<small>°C</small>
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="first_layer_extr_temp">
            <span v-if="item.first_layer_extr_temp !== undefined">
              {{ item.first_layer_extr_temp }}<small>°C</small>
            </span>
          </file-row-item>

          <file-row-item v-if="root === 'gcodes'" :headers="headers" item-value="print_start_time">
            <span v-if="item.print_start_time !== undefined && item.print_start_time !== null">
              {{ $filters.formatDateTime(item.print_start_time) }}
            </span>
          </file-row-item>

          <file-row-item :headers="headers" item-value="modified">
            <span v-if="item.modified !== undefined">
              {{ $filters.formatDateTime(item.modified) }}
            </span>
          </file-row-item>

          <file-row-item right :headers="headers" item-value="size">
            <span v-if="item.size !== undefined">
              {{ $filters.getReadableFileSizeString(item.size) }}
            </span>
          </file-row-item>

        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { AppDirectory, AppFile, AppFileWithMeta, FileFilter } from '@/store/files/types'
import { AppTableHeader } from '@/types'
import FilesMixin from '@/mixins/files'

import FileRowItem from './FileRowItem.vue'

@Component({
  components: {
    FileRowItem
  }
})
export default class FileSystemBrowser extends Mixins(FilesMixin) {
  @Prop({ type: String, required: true })
  root!: string;

  @Prop({ type: Array, required: true })
  files!: AppFile[] | AppDirectory[]

  @Prop({ type: Boolean, default: false })
  dense!: boolean;

  @Prop({ type: Boolean, default: false })
  loading!: boolean;

  // Currently defined list of headers.
  @Prop({ type: Array, required: true })
  headers!: AppTableHeader[]

  @Prop({ type: String, required: false })
  search!: string;

  @Prop({ type: Array, default: () => { return [] } })
  filters!: FileFilter[]

  @Prop({ type: Boolean, required: true })
  dragState!: boolean;

  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  draggedItem: null | AppFile | AppFileWithMeta | AppDirectory = null

  get showMetaData () {
    // Show meta data only for the gcodes root, and only when we are not
    // presenting with dense = true
    return (
      !this.dense &&
      this.root === 'gcodes'
    )
  }

  // Is the history component enabled
  get showHistory () {
    return (
      this.$store.getters['server/componentSupport']('history') &&
      this.root === 'gcodes'
    )
  }

  // Table row is being dragged
  handleDrag (item: AppFile | AppFileWithMeta | AppDirectory) {
    if (this.dragState !== true) {
      this.draggedItem = item
      this.$emit('update:dragState', true)
    }
  }

  // File was dropped on another table row.
  handleDrop (destination: AppFile | AppFileWithMeta | AppDirectory, e: { target: HTMLElement}) {
    this.handleDragLeave(e)
    if (destination.type === 'directory' && this.draggedItem) {
      const source = this.draggedItem
      this.$emit('move', source, destination)
    }
  }

  // Handles highlighting rows as drag over them
  handleDragOver (e: { target: HTMLElement}) {
    if (
      e.target.tagName === 'TD' &&
      e.target.parentElement?.classList.contains('is-directory')
    ) {
      const row = e.target.parentElement
      if (row) row.classList.add('active')
    }
  }

  // Handles un highlighting rows as we drag out of them.
  handleDragLeave (e: { target: HTMLElement}) {
    if (e.target.tagName === 'TD') {
      const row = e.target.parentElement
      if (row) row.classList.remove('active')
    }
  }

  // Drag ended
  handleDragEnd () {
    this.draggedItem = null
    this.$emit('update:dragState', false)
  }
}
</script>
