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
          <td class="grey--text text-no-wrap" v-if="showHistory && !dense">
            <span v-if="item.type === 'file' && item.history && item.history.print_duration">
              {{ $filters.formatCounterTime(item.history.print_duration) }}
            </span>
            <span v-else>--</span>
          </td>
          <td class="grey--text text-no-wrap" v-if="showHistory">
            {{ (item.type === 'directory' || !item.print_start_time) ? '--' : $filters.formatDateTime(item.print_start_time) }}
          </td>
          <td class="grey--text text-no-wrap">
            {{ (item.type === 'directory' && item.name === '..') ? '--' : $filters.formatDateTime(item.modified) }}
          </td>
          <td class="grey--text text-no-wrap text-end">{{ (item.type === 'file') ? $filters.getReadableFileSizeString(item.size) : '--' }}</td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import { AppDirectory, AppFile, AppFileWithMeta, FileFilter } from '@/store/files/types'
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

  @Prop({ type: Array, default: () => { return [] } })
  filters!: FileFilter[]

  @Prop({ type: Boolean, required: true })
  dragState!: boolean;

  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  get headers () {
    let headers: any = [
      { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
      { text: this.$t('app.general.table.header.name'), value: 'name' }
    ]

    if (this.showMetaData) {
      headers = [
        ...headers,
        { text: this.$t('app.general.table.header.height'), value: 'object_height' },
        { text: this.$t('app.general.table.header.layer_height'), value: 'layer_height' },
        { text: this.$t('app.general.table.header.filament_used'), value: 'filament_total' },
        { text: this.$t('app.general.table.header.slicer'), value: 'slicer' },
        { text: this.$t('app.general.table.header.estimated_time'), value: 'estimated_time' }
      ]
    }

    if (this.showHistory) {
      if (!this.dense) headers.push({ text: this.$t('app.general.table.header.actual_time'), value: 'history.print_duration' })
      headers.push(
        {
          text: this.$t('app.general.table.header.last_printed'),
          value: 'print_start_time',
          filter: (value: string, search: string | null, item: AppFile | AppFileWithMeta | AppDirectory) => {
            const filter = this.filters.find(filter => filter.value === 'print_start_time')
            if (
              !this.filters ||
              this.filters.length === 0 ||
              !filter ||
              item.type !== 'file'
            ) return true
            return item.print_start_time === null
          }
        }
      )
    }

    headers = [
      ...headers,
      { text: this.$t('app.general.table.header.modified'), value: 'modified', width: '1%' },
      { text: this.$t('app.general.table.header.size'), value: 'size', width: '1%', align: 'end' }
    ]

    return headers
  }

  draggedItem: null | AppFile | AppFileWithMeta | AppDirectory = null

  get showMetaData () {
    // Show meta data only for the gcodes root, and only when we are not
    // presenting with dense = true
    return (
      !this.dense &&
      this.root === 'gcodes'
    )
  }

  // Is the history plugin enabled
  get showHistory () {
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
