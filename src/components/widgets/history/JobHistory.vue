<template>
  <div class="file-system">
    <v-toolbar
      dense
    >
      <v-spacer />

      <app-column-picker
        v-if="headers"
        key-name="history"
        :headers="configurableHeaders"
      />

      <div
        style="max-width: 160px;"
        class="ms-1 my-1"
      >
        <v-text-field
          v-model="search"
          outlined
          dense
          single-line
          hide-details
          append-icon="$magnify"
        />
      </div>
    </v-toolbar>

    <v-data-table
      :items="history"
      :headers="headers"
      :items-per-page="15"
      :item-class="getRowClasses"
      single-expand
      :search="search"
      :expanded="expanded"
      mobile-breakpoint="0"
      item-key="job_id"
      sort-by="start_time"
      sort-desc
      fixed-header
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

      <template #[`item.data-table-icons`]="{ item }">
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
          :src="getThumbUrl(item.metadata, 'gcodes', getFilePaths(item.filename).path, false, item.metadata.modified)"
          :width="24"
          @error="handleJobThumbnailError(item)"
        >
      </template>

      <template #[`item.filename`]="{ value }">
        {{ getFilePaths(value).filename }}
      </template>

      <template #[`item.status`]="{ item }">
        <job-history-item-status :job="item" />
      </template>

      <template #[`item.start_time`]="{ value }">
        {{ $filters.formatDateTime(value * 1000) }}
      </template>

      <template #[`item.end_time`]="{ item, value }">
        {{
          item.status !== 'in_progress'
            ? $filters.formatDateTime(value * 1000)
            : '--'
        }}
      </template>

      <template #[`item.print_duration`]="{ value }">
        {{ $filters.formatCounterSeconds(value) }}
      </template>

      <template #[`item.total_duration`]="{ value }">
        {{ $filters.formatCounterSeconds(value) }}
      </template>

      <template #[`item.filament_used`]="{ value }">
        {{ $filters.getReadableLengthString(value) }}
      </template>

      <template #[`item.metadata.size`]="{ value }">
        {{ $filters.getReadableFileSizeString(value) }}
      </template>

      <template #[`item.actions`]="{ item }">
        <app-btn
          icon
          @click="handleRemoveJob(item)"
        >
          <v-icon dense>
            $delete
          </v-icon>
        </app-btn>
        <app-btn
          class="v-data-table__expand-icon"
          :class="{ 'v-data-table__expand-icon--active': isExpanded(item) }"
          icon
          @click.prevent.stop="toggleRowExpand(item)"
        >
          <v-icon dense>
            $chevronDown
          </v-icon>
        </app-btn>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import JobHistoryItemStatus from './JobHistoryItemStatus.vue'
import FilesMixin from '@/mixins/files'
import getFilePaths from '@/util/get-file-paths'
import type { HistoryItem } from '@/store/history/types'
import { SocketActions } from '@/api/socketActions'
import type { AppTableHeader } from '@/types'
import type { DataTableHeader } from 'vuetify'

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class JobHistory extends Mixins(FilesMixin) {
  expanded: HistoryItem[] = []
  search = ''

  get configurableHeaders (): AppTableHeader[] {
    const headers: AppTableHeader[] = [
      {
        text: this.$tc('app.general.table.header.status'),
        value: 'status',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.start_time'),
        value: 'start_time',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.end_time'),
        value: 'end_time',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.print_duration'),
        value: 'print_duration',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.total_duration'),
        value: 'total_duration',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.filament_used'),
        value: 'filament_used',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.size'),
        value: 'metadata.size',
        cellClass: 'text-no-wrap',
        width: '1%'
      },
    ]

    const mergedTableHeaders: AppTableHeader[] = this.$store.getters['config/getMergedTableHeaders'](headers, 'history')

    return mergedTableHeaders
  }

  get headers (): DataTableHeader[] {
    return [
      {
        text: '',
        value: 'data-table-icons',
        sortable: false,
        width: '24px'
      },
      {
        text: this.$tc('app.general.table.header.name'),
        value: 'filename'
      },
      ...this.configurableHeaders
        .filter(header => header.visible !== false),
      {
        text: this.$tc('app.general.table.header.actions'),
        value: 'actions',
        sortable: false,
        align: 'end'
      }
    ]
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

  async handleRemoveJob (job: HistoryItem) {
    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_delete', 1),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      SocketActions.serverHistoryDeleteJob(job.job_id)
    }
  }

  handleJobThumbnailError (job: HistoryItem) {
    this.$store.dispatch('history/clearHistoryThumbnails', job.job_id)
  }

  isExpanded (row: HistoryItem) {
    if (this.expanded.length <= 0) return false
    const r = this.expanded[0]
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
