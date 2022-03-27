<template>
  <div class="file-system">
    <!-- <pre>selected: {{ selected }}</pre> -->
    <!-- <div class="bulk-actions" v-if="selected.length > 0">
      Some bulk actions.
    </div> -->

    <v-data-table
      v-model="selectedItems"
      :headers="headers"
      :items="files"
      :dense="dense"
      :disable-pagination="true"
      :loading="loading"
      :sort-desc="true"
      :custom-sort="$filters.fileSystemSort"
      :search="search"
      :show-select="bulkActions"
      :no-data-text="$t('app.file_system.msg.not_found')"
      :no-results-text="$t('app.file_system.msg.not_found')"
      item-key="name"
      height="100%"
      mobile-breakpoint="0"
      sort-by="modified"
      hide-default-footer
      class="rounded-0"
      @input="handleSelected"
      @item-selected="handleItemSelected"
    >
      <template #item="{ item, isSelected, select }">
        <tr
          :class="{
            'is-directory': (item.type === 'directory'),
            'is-file': (item.type === 'file'),
            'is-disabled': disabled,
            'v-data-table__selected': (isSelected && item.name !== '..')
          }"
          class="row-select px-1"
          :draggable="draggable(item)"
          @click.prevent="$emit('row-click', item, $event)"
          @contextmenu.prevent="$emit('row-click', item, $event)"
          @drag="handleDrag(item)"
          @dragstart="handleDragStart"
          @dragend="handleDragEnd"
          @drop.prevent.stop="handleDrop(item, $event)"
          @dragover.prevent="handleDragOver($event)"
          @dragleave.prevent="handleDragLeave($event)"
        >
          <td v-if="bulkActions">
            <v-simple-checkbox
              v-if="item.name !== '..'"
              v-ripple
              :value="isSelected"
              color=""
              class="mt-1"
              @click.stop="select(!isSelected)"
            />
          </td>
          <td>
            <!-- icons are 16px small, or 24px for standard size. -->
            <v-layout justify-center>
              <v-icon
                v-if="!item.thumbnails || !item.thumbnails.length"
                :small="dense"
                :color="(item.type === 'file') ? 'grey' : 'primary'"
              >
                {{ (item.type === 'file' ? '$file' : item.name === '..' ? '$folderUp' : '$folder') }}
              </v-icon>
              <img
                v-if="item.thumbnails && item.thumbnails.length"
                class="file-icon-thumb"
                :class="{dense, large: largeThumbnails}"
                :src="getThumbUrl(item.thumbnails, item.path, false, item.modified)"
              >
            </v-layout>
          </td>

          <file-row-item :nowrap="false">
            {{ item.name }}
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="object_height"
          >
            <span v-if="item.object_height !== undefined">
              {{ $filters.getReadableLengthString(item.object_height) }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="first_layer_height"
          >
            <span v-if="item.first_layer_height !== undefined">
              {{ item.first_layer_height }} mm
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="layer_height"
          >
            <span v-if="item.layer_height !== undefined">
              {{ item.layer_height }} mm
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="filament_total"
          >
            <span v-if="item.filament_total !== undefined">
              {{ $filters.getReadableLengthString(item.filament_total) }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="filament_weight_total"
          >
            <span v-if="item.filament_weight_total !== undefined">
              {{ item.filament_weight_total }} g
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="history.filament_used"
          >
            <span v-if="item.history && item.history.filament_used !== undefined">
              {{ $filters.getReadableLengthString(item.history.filament_used) }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="slicer"
          >
            <span v-if="item.slicer !== undefined">
              {{ item.slicer }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="slicer_version"
          >
            <span v-if="item.slicer_version !== undefined">
              {{ item.slicer_version }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="estimated_time"
          >
            <span v-if="item.estimated_time !== undefined">
              {{ $filters.formatCounterTime(item.estimated_time) }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="history.print_duration"
          >
            <span v-if="item.history && item.history.print_duration !== undefined">
              {{ $filters.formatCounterTime(item.history.print_duration) }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="history.total_duration"
          >
            <span v-if="item.history && item.history.total_duration !== undefined">
              {{ $filters.formatCounterTime(item.history.total_duration) }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="first_layer_bed_temp"
          >
            <span v-if="item.first_layer_bed_temp !== undefined">
              {{ item.first_layer_bed_temp }}<small>°C</small>
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="first_layer_extr_temp"
          >
            <span v-if="item.first_layer_extr_temp !== undefined">
              {{ item.first_layer_extr_temp }}<small>°C</small>
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="print_start_time"
          >
            <span v-if="item.print_start_time !== undefined && item.print_start_time !== null">
              {{ $filters.formatDateTime(item.print_start_time, $store.state.config.uiSettings.general.dateformat + ' YYYY - ' + $store.state.config.uiSettings.general.timeformat) }}
            </span>
          </file-row-item>

          <file-row-item
            :headers="headers"
            item-value="modified"
          >
            <span v-if="item.modified !== undefined && item.modified !== null">
              {{ $filters.formatDateTime(item.modified, $store.state.config.uiSettings.general.dateformat + ' YYYY - ' + $store.state.config.uiSettings.general.timeformat) }}
            </span>
          </file-row-item>

          <file-row-item
            :headers="headers"
            item-value="size"
          >
            <span v-if="item.size !== undefined && item.size !== 0">
              {{ $filters.getReadableFileSizeString(item.size) }}
            </span>
          </file-row-item>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import {
  AppFileWithMeta,
  FileBrowserEntry,
  FileFilter
} from '@/store/files/types'
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
  files!: FileBrowserEntry[]

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

  @Prop({ type: Boolean, default: false })
  bulkActions!: boolean;

  @Prop({ type: Boolean, default: false })
  largeThumbnails!: boolean;

  @Prop({ type: Array, required: true })
  selected!: (FileBrowserEntry | AppFileWithMeta)[]

  dragItem: FileBrowserEntry | AppFileWithMeta | null = null
  ghost: HTMLDivElement | undefined = undefined
  selectedItems: (FileBrowserEntry | AppFileWithMeta)[] = []

  // Is the history component enabled
  get showHistory () {
    return (
      this.$store.getters['server/componentSupport']('history') &&
      this.root === 'gcodes'
    )
  }

  mounted () {
    this.selectedItems = this.selected
  }

  // Make sure we update the selected items if it's changed.
  @Watch('selected')
  onSelected (selected: (FileBrowserEntry | AppFileWithMeta)[]) {
    this.selectedItems = selected
  }

  // When the selected items change, update the parent.
  handleSelected (selected: (FileBrowserEntry | AppFileWithMeta)[]) {
    this.$emit('update:selected', selected)
  }

  // We ignore our [..] dir, so handle faking our checkbox states.
  handleItemSelected (item: { item: FileBrowserEntry | AppFileWithMeta; value: boolean }) {
    // If last two, and filtered results in 0 - set to 0.
    if (
      !item.value &&
      this.selectedItems.length <= 2 &&
      this.selectedItems.filter(fileOrFolder => (fileOrFolder.name !== '..' && item.item !== fileOrFolder)).length === 0
    ) {
      this.selectedItems = []
    }

    // If top two, and filtered results in count -1, set to all.
    if (
      item.value &&
      this.selectedItems.length + 1 >= this.files.length &&
      this.selectedItems.filter(fileOrFolder => (fileOrFolder.name !== '..')).length + 1 === this.files.length
    ) {
      this.selectedItems = this.files
    }
  }

  // Determines if a row is currently in a draggable state or not.
  draggable (item: FileBrowserEntry | AppFileWithMeta) {
    return (
      item.name !== '..' &&
      this.files.length > 0 &&
      (
        this.selected.length === 0 ||
        this.selected.includes(item)
      )
    )
  }

  // Fake a drag image when the user drags a file or folder.
  handleDragStart (e: DragEvent) {
    if (e.dataTransfer) {
      this.ghost = document.createElement('div')
      this.ghost.classList.add('bulk-drag')
      this.ghost.classList.add((this.$vuetify.theme.dark) ? 'theme--dark' : 'theme--light')
      this.ghost.innerHTML = (this.selected.length > 0)
        ? `Move ${this.selected.length} items`
        : 'Move item'
      document.body.appendChild(this.ghost)
      e.dataTransfer.dropEffect = 'move'
      e.dataTransfer.setDragImage(this.ghost, 0, 0)
    }
  }

  // Table row is being dragged
  handleDrag (item: FileBrowserEntry | AppFileWithMeta) {
    if (this.dragState !== true) {
      this.dragItem = item
      this.$emit('update:dragState', true)
    }
  }

  // File was dropped on another table row.
  handleDrop (destination: FileBrowserEntry | AppFileWithMeta, e: { target: HTMLElement}) {
    this.handleDragLeave(e)
    if (
      destination.type === 'directory' &&
      this.dragItem &&
      this.dragItem !== destination &&
      !this.selected.includes(destination)
    ) {
      const source = (this.selected.length === 0)
        ? [this.dragItem]
        : this.selected.filter(item => (item.name !== '..'))
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
    const e = this.ghost as HTMLDivElement
    document.body.removeChild(e)
    this.dragItem = null
    this.$emit('update:dragState', false)
  }
}
</script>

<style lang="scss" scoped>
  @import '~vuetify/src/styles/styles.sass';

  // Lighten up dark mode checkboxes.
  .theme--dark ::v-deep .v-simple-checkbox .v-icon {
    color: rgba(map-deep-get($material-dark, 'inputs', 'box'), 0.25);
  }

  .file-icon-thumb {
    max-width: 24px;
  }

  .file-icon-thumb.dense {
    max-width: 16px;
  }

  .file-icon-thumb.large {
    max-width: initial;
    max-height: 32px;
  }

</style>
