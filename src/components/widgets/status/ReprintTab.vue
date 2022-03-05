<template>
  <div class="file-system">
    <v-data-table
      :items="history"
      :headers="headers"
      :items-per-page="5"
      mobile-breakpoint="0"
      hide-default-footer
      item-key="job_id"
      sort-by="start_time"
      sort-desc
      style="background-color: transparent;"
    >
      <template
        v-slot:item="{ item }"
      >
        <tr
          class="px-1"
        >
          <td>
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
              v-if="item.exists && !item.metadata.thumbnails"
              class="mr-2"
            >
              $fileDocument
            </v-icon>

            <!-- If the item exists, and we have thumbnail data. -->
            <img
              v-if="item.exists && item.metadata.thumbnails && item.metadata.thumbnails.length"
              class="mr-2 file-icon-thumb"
              :src="getThumbUrl(item.metadata.thumbnails, getFilePaths(item.filename).path, false, item.metadata.modified)"
              :width="24"
            >
          </td>

          <td>
            <span class="">
              {{ getFilePaths(item.filename).filename }}
            </span>
          </td>

          <td>
            <job-history-item-status :job="item" />
          </td>

          <td>
            <span
              class="text-no-wrap"
              v-if="item.print_duration > 0"
            >
              {{ $filters.formatCounterTime(item.print_duration) }}
            </span>
            <span v-else>--</span>
          </td>

          <!-- <td>
            <span class="text-no-wrap" v-if="item.total_duration > 0">
              {{ $filters.formatCounterTime(item.total_duration) }}
            </span>
            <span v-else>--</span>
          </td> -->

          <!-- <td>
            <span class="text-no-wrap">
              {{ $filters.formatDateTime(item.start_time, 'lll') }}
            </span>
          </td> -->

          <td
            class="actions"
            v-if="!printerPrinting"
          >
            <div>
              <app-btn
                @click="$emit('print', item.filename)"
                color=""
                icon
              >
                <v-icon>$printer</v-icon>
              </app-btn>
            </div>
          </td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import StateMixin from '@/mixins/state'
import getFilePaths from '@/util/get-file-paths'
import JobHistoryItemStatus from '@/components/widgets/history/JobHistoryItemStatus.vue'

@Component({
  components: {
    JobHistoryItemStatus
  }
})
export default class ReprintTab extends Mixins(StateMixin, FilesMixin) {
  get history () {
    return this.$store.getters['history/getUniqueHistory'](3)
  }

  getFilePaths (filename: string) {
    return getFilePaths(filename, 'gcodes')
  }

  get headers () {
    const headers = [
      { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
      { text: this.$tc('app.general.table.header.name'), value: 'filename', sortable: false },
      { text: this.$tc('app.general.table.header.status'), value: 'status', sortable: false },
      { text: this.$tc('app.general.table.header.print_duration'), value: 'print_duration', sortable: false }
      // { text: this.$tc('app.general.table.header.total_duration'), value: 'total_duration', sortable: false },
      // { text: this.$tc('app.general.table.header.start_time'), value: 'start_time', sortable: false }
    ]
    return headers
  }
}
</script>
