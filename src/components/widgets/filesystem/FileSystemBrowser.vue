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
      no-data-text="No files"
      no-results-text="No files found"
      sort-by="modified"
      hide-default-footer
      class="rounded-0"
    >

      <template v-slot:item="{ item }">
        <tr
          :class="{ 'is-directory': (item.type === 'directory'), 'is-file': (item.type === 'file') }"
          class="px-1"
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
              :color="(item.type === 'file') ? 'grey' : 'primary'"
              class="mr-2">
              {{ (item.type === 'file' ? '$file' : item.name === '..' ? '$folderUp' : '$folder') }}
            </v-icon>
            <img
              v-if="item.thumbnails && item.thumbnails.length"
              class="mr-2 file-icon-thumb"
              :src="getThumbUrl(item.thumbnails, item.path)"
              :width="(dense) ? 16 : 24"
            />
          </td>
          <td class="grey--text">
            {{ item.name }}
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.object_height">
              {{ item.object_height }} mm
            </span>
            <span v-else>--</span>
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.layer_height">
              {{ item.layer_height }} mm
            </span>
            <span v-else>--</span>
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.filament_total">
              {{ $filters.getReadableLengthString(item.filament_total) }}
            </span>
            <span v-else>--</span>
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.slicer">
              {{ item.slicer }}
            </span>
            <span v-else>--</span>
          </td>
          <td class="grey--text text-no-wrap" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.estimated_time">
              {{ $filters.formatCounterTime(item.estimated_time) }}
            </span>
            <span v-else>--</span>
          </td>
          <td class="grey--text text-no-wrap" v-if="showLastPrinted">
            {{ (item.type === 'directory' || !item.start_time) ? '--' : $filters.formatFileDateTime(item.start_time) }}
          </td>
          <td class="grey--text text-no-wrap">
            {{ (item.type === 'directory' && item.name === '..') ? '--' : $filters.formatFileDateTime(item.modified) }}
          </td>
          <td class="grey--text text-no-wrap text-end">{{ (item.type === 'file') ? $filters.getReadableFileSizeString(item.size) : '--' }}</td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { AppDirectory, AppFile, AppFileWithMeta } from '@/store/files/types'
import FilesMixin from '@/mixins/files'

@Component({})
export default class FileSystemBrowser extends Mixins(FilesMixin) {
  @Prop({ type: String, required: true })
  root!: string;

  @Prop({ type: Array, required: true })
  files!: AppFile[] | AppDirectory[]

  @Prop({ type: Boolean, default: false })
  dense!: boolean;

  @Prop({ type: Boolean, default: false })
  loading!: boolean;

  @Prop({ type: String, required: false })
  search!: string;

  @Prop({ type: Boolean, required: true })
  dragState!: boolean;

  get headers () {
    let headers: any = [
      { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
      { text: 'name', value: 'name' }
    ]

    if (this.showMetaData) {
      headers = [
        ...headers,
        { text: 'height', value: 'object_height' },
        { text: 'layer height', value: 'layer_height' },
        { text: 'filament', value: 'filament_total' },
        { text: 'slicer', value: 'slicer' },
        { text: 'estimated time', value: 'estimated_time' }
      ]
    }

    if (this.showLastPrinted) {
      headers.push({ text: 'last printed', value: 'start_time' })
    }

    headers = [
      ...headers,
      { text: 'modified', value: 'modified', width: '1%' },
      { text: 'size', value: 'size', width: '1%', align: 'end' }
    ]

    return headers
  }

  draggedItem: null | AppFile | AppFileWithMeta | AppDirectory = null

  get showMetaData () {
    // Show meta data only for the gcodes root, and only when we are not
    // presenting with dense = true
    if (this.root === 'gcodes' && !this.dense) return true
    return false
  }

  // Is the history plugin enabled
  get showLastPrinted () {
    return (
      this.$store.getters['server/pluginSupport']('history') &&
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
