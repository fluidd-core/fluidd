<template>
  <div class="file-system">
    <v-toolbar
      dense
    >
      <v-spacer />

      <app-column-picker
        v-if="headers"
        key-name="history"
        :headers="headers"
      />

      <div
        style="max-width: 160px;"
        class="ml-1"
      >
        <v-text-field
          v-model="search"
          outlined
          dense
          single-line
          hide-details
          append-icon="$magnify"
          @keyup="$emit('update:search', search);"
        />
      </div>
    </v-toolbar>

    <v-data-table
      :items="history"
      :headers="visibleHeaders"
      :items-per-page="15"
      :item-class="getRowClasses"
      :single-expand="true"
      :search="search"
      :expanded="expanded"
      mobile-breakpoint="0"
      item-key="job_id"
      sort-by="start_time"
      sort-desc
    >
      <template #expanded-item="{ headers, item }">
        <td
          :colspan="headers.length"
          class="pa-4"
        >
          <div class="chip-group">
            <template v-for="(key, i) in Object.keys(item.metadata)">
              <v-chip
                v-if="key !== 'thumbnails'"
                :key="i"
                small
              >
                {{ key }}: {{ item.metadata[key] }}
              </v-chip>
            </template>
          </div>
        </td>
      </template>

      <template
        #[`item.data-table-icons`]="{ item }"
      >
        <!-- If the item no longer exists. -->
        <v-icon
          v-if="!item.exists"
          class="mr-2"
          color="secondary"
        >
          $fileCancel
        </v-icon>

        <!-- If the item exists, but has no thumbnail data. -->
        <v-icon
          v-else-if="!item.metadata.thumbnails?.length"
          class="mr-2"
          color="secondary"
        >
          $file
        </v-icon>

        <!-- If the item exists, and we have thumbnail data. -->
        <img
          v-else
          class="mr-2 file-icon-thumb"
          :src="getThumbUrl(item.metadata.thumbnails, getFilePaths(item.filename).path, false, item.metadata.modified)"
          :width="24"
          @error="handleJobThumbnailError(item)"
        >
      </template>

      <template
        #[`item.filename`]="{ item }"
      >
        <span class="">
          {{ getFilePaths(item.filename).filename }}
        </span>
      </template>

      <template
        #[`item.status`]="{ item }"
      >
        <job-history-item-status :job="item" />
      </template>

      <template
        #[`item.start_time`]="{ item }"
      >
        <span class="text-no-wrap">
          {{ $filters.formatDateTime(item.start_time * 1000) }}
        </span>
      </template>

      <template
        #[`item.end_time`]="{ item }"
      >
        <span
          v-if="item.status !== 'in_progress'"
          class="text-no-wrap"
        >
          {{ $filters.formatDateTime(item.end_time * 1000) }}
        </span>
        <span v-else>--</span>
      </template>

      <template
        #[`item.print_duration`]="{ item }"
      >
        <span class="text-no-wrap">
          {{ $filters.formatCounterTime(item.print_duration) }}
        </span>
      </template>

      <template
        #[`item.total_duration`]="{ item }"
      >
        <span class="text-no-wrap">
          {{ $filters.formatCounterTime(item.total_duration) }}
        </span>
      </template>

      <template
        #[`item.filament_used`]="{ item }"
      >
        <span class="text-no-wrap">
          {{ $filters.getReadableLengthString(item.filament_used) }}
        </span>
      </template>

      <template
        #[`item.metadata.size`]="{ item }"
      >
        <span class="text-no-wrap">
          {{ $filters.getReadableFileSizeString(item.metadata.size) }}
        </span>
      </template>

      <template
        #[`item.actions`]="{ item }"
      >
        <div class="text-no-wrap">
          <v-btn
            icon
            small
            @click="handleRemoveJob(item)"
          >
            <v-icon
              small
              color=""
            >
              $delete
            </v-icon>
          </v-btn>
          <v-btn
            class="v-data-table__expand-icon"
            color=""
            :class="{ 'v-data-table__expand-icon--active': isExpanded(item) }"
            icon
            small
            @click.prevent.stop="toggleRowExpand(item)"
          >
            <v-icon>$chevronDown</v-icon>
          </v-btn>
        </div>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import JobHistoryItemStatus from './JobHistoryItemStatus.vue'
import FilesMixin from '@/mixins/files'
import getFilePaths from '@/util/get-file-paths'
import { HistoryItem } from '@/store/history/types'
import { SocketActions } from '@/api/socketActions'
import { AppTableHeader } from '@/types'

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class JobHistory extends Mixins(FilesMixin) {
  expanded: HistoryItem[] = []
  search = ''

  get headers (): AppTableHeader[] {
    const headers = [
      { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
      { text: this.$tc('app.general.table.header.name'), value: 'filename' },
      { text: this.$tc('app.general.table.header.status'), value: 'status', configurable: true },
      { text: this.$tc('app.general.table.header.start_time'), value: 'start_time', configurable: true },
      { text: this.$tc('app.general.table.header.end_time'), value: 'end_time', configurable: true },
      { text: this.$tc('app.general.table.header.print_duration'), value: 'print_duration', configurable: true },
      { text: this.$tc('app.general.table.header.total_duration'), value: 'total_duration', configurable: true },
      { text: this.$tc('app.general.table.header.filament_used'), value: 'filament_used', configurable: true },
      { text: this.$t('app.general.table.header.size'), value: 'metadata.size', width: '1%', configurable: true },
      { text: this.$tc('app.general.table.header.actions'), value: 'actions', sortable: false, align: 'end' }
    ]
    const key = 'history'
    return this.$store.getters['config/getMergedTableHeaders'](headers, key)
  }

  get visibleHeaders (): AppTableHeader[] {
    return this.headers.filter(header => header.visible || header.visible === undefined)
  }

  get history () {
    return this.$store.getters['history/getHistory']
  }

  getRowClasses (item: HistoryItem) {
    if (!item.exists) return 'v-data-table__inactive'
    return ''
  }

  getFilePaths (filename: string) {
    return getFilePaths(filename, 'gcodes')
  }

  getFilename (filename: string) {
    return filename.split('/').pop() || ''
  }

  handleRemoveJob (job: HistoryItem) {
    SocketActions.serverHistoryDeleteJob(job.job_id)
  }

  handleJobThumbnailError (job: HistoryItem) {
    this.$store.dispatch('history/clearHistoryThumbnails', job.job_id)
  }

  isExpanded (row: HistoryItem) {
    if (this.expanded.length <= 0) return false
    const r = this.expanded[0] as HistoryItem
    return (row.job_id === r.job_id)
  }

  toggleRowExpand (row: HistoryItem) {
    if (this.isExpanded(row)) {
      this.expanded = []
    } else {
      this.expanded = [row]
    }
  }
}
</script>
