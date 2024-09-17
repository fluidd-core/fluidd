<template>
  <div class="file-system">
    <!-- <pre>selected: {{ selected }}</pre> -->
    <!-- <div class="bulk-actions" v-if="selected.length > 0">
      Some bulk actions.
    </div> -->

    <v-data-table
      :value="selected"
      :headers="headers"
      :items="files"
      :dense="dense"
      disable-pagination
      :loading="loading"
      :custom-sort="customSort"
      :search="search"
      :show-select="bulkActions"
      :no-data-text="$t('app.file_system.msg.not_found')"
      :no-results-text="$t('app.file_system.msg.not_found')"
      item-key="name"
      height="100%"
      mobile-breakpoint="0"
      must-sort
      :sort-by.sync="sortBy"
      :sort-desc.sync="sortDesc"
      hide-default-footer
      class="rounded-0"
      fixed-header
      @input="handleSelected"
    >
      <template #item="{ item, isSelected, select }">
        <tr
          :class="{
            'is-disabled': disabled,
            'v-data-table__selected': (isSelected && item.name !== '..')
          }"
          class="row-select px-1"
          :draggable="isItemDraggable(item)"
          @click.prevent="$emit('row-click', item, $event)"
          @contextmenu.prevent="$emit('row-click', item, $event)"
          @dragstart="handleDragStart(item, $event)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver(item, $event)"
          @dragenter.prevent
          @dragleave.prevent="handleDragLeave"
          @drop.prevent="handleDrop(item, $event)"
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
            <v-layout
              justify-center
              class="no-pointer-events"
            >
              <v-icon
                v-if="!item.thumbnails || !item.thumbnails.length"
                :small="dense"
                :color="(item.type === 'file') ? 'grey' : 'primary'"
              >
                {{ getItemIcon(item) }}
              </v-icon>
              <img
                v-else
                :style="{'max-width': `${thumbnailSize}px`, 'max-height': `${thumbnailSize}px`}"
                :src="getThumbUrl(item, root, item.path, thumbnailSize > 16, item.modified)"
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
            item-value="filament_name"
          >
            <span v-if="item.filament_name !== undefined">
              {{ item.filament_name }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="filament_type"
          >
            <span v-if="item.filament_type !== undefined">
              {{ item.filament_type }}
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
              {{ $filters.getReadableWeightString(item.filament_weight_total) }}
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
            item-value="nozzle_diameter"
          >
            <span v-if="item.nozzle_diameter !== undefined">
              {{ item.nozzle_diameter }} mm
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
              {{ $filters.formatCounterSeconds(item.estimated_time) }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="history.print_duration"
          >
            <span v-if="item.history && item.history.print_duration !== undefined">
              {{ $filters.formatCounterSeconds(item.history.print_duration) }}
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="history.total_duration"
          >
            <span v-if="item.history && item.history.total_duration !== undefined">
              {{ $filters.formatCounterSeconds(item.history.total_duration) }}
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
            item-value="chamber_temp"
          >
            <span v-if="item.chamber_temp !== undefined">
              {{ item.chamber_temp }}<small>°C</small>
            </span>
          </file-row-item>

          <file-row-item
            v-if="root === 'gcodes'"
            :headers="headers"
            item-value="print_start_time"
          >
            <span v-if="item.print_start_time !== undefined && item.print_start_time !== null">
              {{ $filters.formatDateTime(item.print_start_time * 1000) }}
            </span>
          </file-row-item>

          <file-row-item
            :headers="headers"
            item-value="modified"
          >
            <span v-if="item.modified !== undefined && item.name !== '..'">
              {{ $filters.formatDateTime(item.modified * 1000) }}
            </span>
          </file-row-item>

          <file-row-item
            :headers="headers"
            item-value="size"
          >
            <span v-if="item.size !== undefined && item.name !== '..'">
              {{ $filters.getReadableFileSizeString(item.size) }}
            </span>
          </file-row-item>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel, PropSync } from 'vue-property-decorator'
import type { FileBrowserEntry, RootProperties } from '@/store/files/types'
import type { AppTableHeader } from '@/types'
import FilesMixin from '@/mixins/files'

import FileRowItem from './FileRowItem.vue'
import { SupportedImageFormats, SupportedVideoFormats } from '@/globals'

@Component({
  components: {
    FileRowItem
  }
})
export default class FileSystemBrowser extends Mixins(FilesMixin) {
  @VModel({ type: Array<FileBrowserEntry>, required: true })
    selected!: FileBrowserEntry[]

  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: Array<FileBrowserEntry>, required: true })
  readonly files!: FileBrowserEntry[]

  @Prop({ type: Boolean })
  readonly dense?: boolean

  @Prop({ type: Boolean })
  readonly loading?: boolean

  // Currently defined list of headers.
  @Prop({ type: Array<AppTableHeader>, required: true })
  readonly headers!: AppTableHeader[]

  @Prop({ type: String })
  readonly search?: string

  @PropSync('dragState', { type: Boolean, required: true })
    dragStateModel!: boolean

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly bulkActions?: boolean

  dragItem: FileBrowserEntry | null = null
  ghost?: HTMLDivElement = undefined

  // Is the history component enabled
  get showHistory () {
    return (
      this.$store.getters['server/componentSupport']('history') &&
      this.root === 'gcodes'
    )
  }

  get rootProperties (): RootProperties {
    return this.$store.getters['files/getRootProperties'](this.root) as RootProperties
  }

  get readonly () {
    return this.rootProperties.readonly
  }

  get thumbnailSize () {
    const thumbnailSize = this.$store.state.config.uiSettings.general.thumbnailSize

    return this.dense ? thumbnailSize / 2 : thumbnailSize
  }

  get textSortOrder () {
    return this.$store.state.config.uiSettings.general.textSortOrder
  }

  get draggedItems () {
    if (this.dragItem) {
      const filteredSelectedItems = this.selected
        .filter(item => item.name !== '..')

      const draggedItems = filteredSelectedItems.length > 0
        ? filteredSelectedItems
        : [this.dragItem]

      return draggedItems
    }

    return []
  }

  get sortBy () {
    return this.$store.state.config.uiSettings.fileSystem.sortBy[this.root] as string | null ?? 'modified'
  }

  set sortBy (value: string | null | undefined) {
    this.$store.dispatch('config/updateFileSystemSortBy', { root: this.root, value: value ?? null })
  }

  get sortDesc () {
    return this.$store.state.config.uiSettings.fileSystem.sortDesc[this.root] as boolean | null ?? true
  }

  set sortDesc (value: boolean | null | undefined) {
    this.$store.dispatch('config/updateFileSystemSortDesc', { root: this.root, value: value ?? null })
  }

  customSort (items: FileBrowserEntry[], sortBy: string[], sortDesc: boolean[], locale: string) {
    return this.$filters.fileSystemSort(items, sortBy, sortDesc, locale, this.textSortOrder)
  }

  handleSelected (selected: FileBrowserEntry[]) {
    if (selected.length === 1) {
      if (selected[0].name === '..') {
        selected = []
      } else {
        selected = this.files
          .filter(item => item.name === selected[0].name || item.name === '..')
      }
    }

    this.$emit('input', selected)
  }

  getItemIcon (item: FileBrowserEntry) {
    const readonly = !this.isItemWriteable(item)

    if (item.type === 'file') {
      if (item.extension === 'zip') {
        return readonly ? '$fileZipLock' : '$fileZip'
      } else if (
        SupportedImageFormats.includes(`.${item.extension}`) ||
            SupportedVideoFormats.includes(`.${item.extension}`)
      ) {
        return readonly ? '$fileImageLock' : '$fileImage'
      } else {
        return readonly ? '$fileLock' : '$file'
      }
    } else if (item.name === '..') {
      return '$folderUp'
    } else {
      return readonly ? '$folderLock' : '$folder'
    }
  }

  // Determines if a row is currently in a draggable state or not.
  isItemDraggable (item: FileBrowserEntry) {
    return (
      item.name !== '..' &&
      this.files.length > 0 &&
      (
        this.selected.length === 0 ||
        this.selected.includes(item)
      )
    )
  }

  isItemWriteable (item: FileBrowserEntry) {
    return (
      !this.readonly &&
      (
        item.permissions === undefined ||
        item.permissions.includes('w')
      )
    )
  }

  // Fake a drag image when the user drags a file or folder.
  handleDragStart (item: FileBrowserEntry, event: DragEvent) {
    if (this.dragStateModel !== true) {
      this.dragItem = item
      this.dragStateModel = true
    }

    if (event.dataTransfer) {
      const draggedItems = this.draggedItems

      this.ghost = document.createElement('div')
      this.ghost.classList.add('bulk-drag')
      this.ghost.classList.add((this.$vuetify.theme.dark) ? 'theme--dark' : 'theme--light')
      this.ghost.innerHTML = draggedItems.length > 1
        ? this.$tc('app.file_system.tooltip.items_count', draggedItems.length)
        : item.name
      document.body.appendChild(this.ghost)
      event.dataTransfer.effectAllowed = 'all'
      event.dataTransfer.setDragImage(this.ghost, 0, 0)

      this.$emit('drag-start', item, draggedItems, event.dataTransfer)
    }
  }

  // File was dropped on another table row.
  handleDrop (item: FileBrowserEntry, event: DragEvent) {
    this.handleDragLeave(event)

    if (
      item.type === 'directory' &&
      this.isItemWriteable(item) &&
      event.dataTransfer &&
      this.dragItem &&
      this.dragItem !== item
    ) {
      const draggedItems = this.draggedItems

      if (!draggedItems.includes(item)) {
        this.$emit('move', draggedItems, item)
      }
    }
  }

  // Handles highlighting rows as drag over them
  handleDragOver (item: FileBrowserEntry, event: DragEvent) {
    if (
      item.type === 'directory' &&
      this.isItemWriteable(item) &&
      event.dataTransfer &&
      this.dragItem &&
      this.dragItem !== item &&
      !this.draggedItems.includes(item)
    ) {
      event.preventDefault()

      event.dataTransfer.dropEffect = 'move'

      if (event.target instanceof HTMLElement) {
        let element: HTMLElement | null = event.target

        while (element) {
          if (element.tagName === 'TR') {
            element.classList.add('active')

            return
          }

          element = element.parentElement
        }
      }
    }
  }

  // Handles un highlighting rows as we drag out of them.
  handleDragLeave (event: DragEvent) {
    if (event.target instanceof HTMLElement) {
      let element: HTMLElement | null = event.target

      while (element) {
        if (element.tagName === 'TR') {
          element.classList.remove('active')

          return
        }

        element = element.parentElement
      }
    }
  }

  // Drag ended
  handleDragEnd () {
    const ghost = this.ghost

    if (ghost) {
      document.body.removeChild(ghost)
      this.ghost = undefined
    }

    this.dragItem = null
    this.dragStateModel = false
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  // Lighten up dark mode checkboxes.
  .theme--dark :deep(.v-simple-checkbox .v-icon) {
    color: rgba(map-deep-get($material-dark, 'inputs', 'box'), 0.25);
  }
</style>
