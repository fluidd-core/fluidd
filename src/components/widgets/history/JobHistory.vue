<template>
  <div class="file-system">
    <!-- // search here -->
    <v-row justify="end">
      <v-col cols="12" sm="4" md="3" class="px-6 pt-5">
        <v-text-field
          v-model="search"
          outlined
          dense
          single-line
          hide-details
          append-icon="$magnify">
        </v-text-field>
      </v-col>
    </v-row>

    <v-data-table
      :items="history"
      :headers="headers"
      :items-per-page="5"
      :single-expand="true"
      :search="search"
      :expanded="expanded"
      item-key="job_id"
      sort-by="start_time"
      sort-desc>

      <template v-slot:expanded-item="{ headers, item }">
        <td :colspan="headers.length" class="pa-4">
          <div class="chip-group">
            <template v-for="(key, i) in Object.keys(item.metadata)">
              <v-chip
                v-if="key !== 'thumbnails'"
                :key="i"
                small>
                {{ key }}: {{ item.metadata[key] }}
              </v-chip>
            </template>
          </div>
        </td>
      </template>

      <template
        v-slot:[`item.data-table-icons`]="{ item }"
      >
        <v-icon
          v-if="!item.metadata.thumbnails || !item.metadata.thumbnails.length"
          small
          color="grey darken-2"
          class="mr-2">
          $fileDocument
        </v-icon>
        <img
          v-if="item.metadata.thumbnails && item.metadata.thumbnails.length"
          class="mr-2 file-icon-thumb"
          :src="getThumbUrl(item.metadata.thumbnails, getFilePaths(item.filename).path)"
          :width="16"
        />
      </template>

      <template
        v-slot:[`item.filename`]="{ item }"
      >
        <span class="grey--text">
          {{ getFilePaths(item.filename).filename }}
        </span>
      </template>

      <template
        v-slot:[`item.start_time`]="{ item }"
      >
        <span class="grey--text text-no-wrap">
          {{ $filters.formatDateTime(item.start_time, 'lll') }}
        </span>
      </template>

      <template
        v-slot:[`item.print_duration`]="{ item }"
      >
        <span class="grey--text text-no-wrap">
          {{ $filters.formatCounterTime(item.print_duration) }}
        </span>
      </template>

      <template
        v-slot:[`item.filament_used`]="{ item }"
      >
        <span class="grey--text text-no-wrap">
          {{ $filters.getReadableLengthString(item.print_duration) }}
        </span>
      </template>

      <template
        v-slot:[`item.status`]="{ item }"
      >
        <job-history-item-status :job="item"></job-history-item-status>
      </template>

      <template
        v-slot:[`item.actions`]="{ item }"
      >
        <div class="text-no-wrap">
          <v-btn
            @click="handleRemoveJob(item)"
            icon
            small
          >
            <v-icon small color="grey">
              $delete
            </v-icon>
          </v-btn>
          <v-btn
            @click.prevent.stop="toggleRowExpand(item)"
            class="v-data-table__expand-icon"
            color="grey"
            :class="{ 'v-data-table__expand-icon--active': isExpanded(item) }"
            icon
            small
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
import { getFilePaths } from '@/store/helpers'
import { HistoryItem } from '@/store/history/types'
import { SocketActions } from '@/socketActions'

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class JobHistory extends Mixins(FilesMixin) {
  expanded: HistoryItem[] = []
  search = ''

  get headers () {
    return [
      { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
      { text: this.$t('app.general.table.header.name'), value: 'filename' },
      { text: this.$t('app.general.table.header.status'), value: 'status' },
      { text: this.$t('app.general.table.header.start_time'), value: 'start_time' },
      { text: this.$t('app.general.table.header.print_duration'), value: 'print_duration' },
      { text: this.$t('app.general.table.header.filament_used'), value: 'filament_used' },
      { text: this.$t('app.general.table.header.actions'), value: 'actions', sortable: false }
    ]
  }

  get history () {
    return this.$store.getters['history/getHistory']
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
