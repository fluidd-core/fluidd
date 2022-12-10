<template>
  <div class="file-system">
    <v-spacer />
    <v-data-table
      :key="dataKey"
      :items="queue"
      :headers="visibleHeaders"
      :items-per-page="-1"
      mobile-breakpoint="0"
    >
      <template #body="props">
        <draggable
          v-model="queue"
          tag="tbody"
        >
          <tr
            v-for="(item, index) in props.items"
            :key="`row.${index}`"
          >
            <td :key="`col.${index}.filename`">
              <span class="">
                {{ getFilePaths(item.filename).filename }}
              </span>
            </td>
            <td
              :key="`col.${index}.time_added`"
            >
              <span class="text-no-wrap">
                {{ $filters.formatAbsoluteDateTime(item.time_added) }}
              </span>
            </td>
            <td
              :key="`col.${index}.time_in_queue`"
            >
              <span class="text-no-wrap">
                {{ $filters.formatCounterTime(item.time_in_queue) }}
              </span>
            </td>
            <td
              :key="`col.${index}.action`"
            >
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
            </td>
          </tr>
        </draggable>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import getFilePaths from '@/util/get-file-paths'
import { QueueJob } from '@/store/jobQueue/types'
import { SocketActions } from '@/api/socketActions'
import { AppTableHeader } from '@/types'
import draggable from 'vuedraggable'

@Component({
  components: {
    draggable
  }
})
export default class JobQueue extends Mixins(FilesMixin) {
  expanded: QueueJob[] = []
  search = ''
  datakey = 0
  datakey2 = 0

  get headers (): AppTableHeader[] {
    const headers = [
      // { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
      { text: this.$tc('app.general.table.header.name'), value: 'filename', sortable: false },
      { text: this.$tc('app.general.table.header.time_added'), value: 'time_added', configurable: true, sortable: false },
      { text: this.$tc('app.general.table.header.time_in_queue'), value: 'time_in_queue', configurable: true, sortable: false },
      { text: this.$tc('app.general.table.header.actions'), value: 'action', sortable: false, align: 'end' }
    ]
    const key = 'queue'
    return this.$store.getters['config/getMergedTableHeaders'](headers, key)
  }

  get visibleHeaders (): AppTableHeader[] {
    return this.headers.filter(header => header.visible || header.visible === undefined)
  }

  get dataKey () {
    return this.datakey2
  }

  set dataKey (value) {
    this.datakey2 += 1
  }

  get queue () {
    return this.$store.getters['files/getQueue'].jobs
  }

  set queue (val) {
    const currentQueue = this.$store.getters['files/getQueue']
    const formattedQueue = { queued_jobs: val, queue_state: currentQueue.status }
    this.$store.dispatch('files/updateQueueStatus', formattedQueue)
    // SocketActions.jobQueueSetQueue(val)
  }

  getFilePaths (filename: string) {
    return getFilePaths(filename, 'gcodes')
  }

  getFilename (filename: string) {
    return filename.split('/').pop() || ''
  }

  handleRemoveJob (job: QueueJob) {
    SocketActions.serverJobQueueDeleteJob(job.job_id)
  }

  isExpanded (row: QueueJob) {
    if (this.expanded.length <= 0) return false
    const r = this.expanded[0] as QueueJob
    return (row.job_id === r.job_id)
  }

  toggleRowExpand (row: QueueJob) {
    if (this.isExpanded(row)) {
      this.expanded = []
    } else {
      this.expanded = [row]
    }
  }
}
</script>
