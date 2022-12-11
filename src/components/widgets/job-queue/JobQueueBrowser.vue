<template>
  <div class="file-system">
    <v-data-table
      item-key="job_id"
      :headers="visibleHeaders"
      :items="jobs"
      :dense="dense"
      :disable-pagination="true"
      :loading="$waits.onJobQueue"
      mobile-breakpoint="0"
      hide-default-footer
    >
      <template #body="props">
        <tbody v-if="props.items.length === 0">
          <tr>
            <td colspan="3">
              <span>{{ $t('app.file_system.msg.not_found') }}</span>
            </td>
          </tr>
        </tbody>
        <draggable
          v-else
          v-model="jobs"
          tag="tbody"
        >
          <tr
            v-for="item in props.items"
            :key="item.job_id"
            class="row-select"
            @click.prevent="$emit('row-click', item, $event)"
            @contextmenu.prevent="$emit('row-click', item, $event)"
          >
            <td>
              <span>
                {{ item.filename }}
              </span>
            </td>
            <td>
              <span class="text-no-wrap">
                {{ $filters.formatAbsoluteDateTime(item.time_added * 1000) }}
              </span>
            </td>
            <td>
              <span class="text-no-wrap">
                {{ $filters.formatCounterTime(item.time_in_queue) }}
              </span>
            </td>
          </tr>
        </draggable>
      </template>
    </v-data-table>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import getFilePaths from '@/util/get-file-paths'
import { QueuedJob } from '@/store/jobQueue/types'
import { SocketActions } from '@/api/socketActions'
import { AppTableHeader } from '@/types'
import draggable from 'vuedraggable'

@Component({
  components: {
    draggable
  }
})
export default class JobQueueBrowser extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly dense!: boolean

  get headers (): AppTableHeader[] {
    const headers = [
      // { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
      { text: this.$tc('app.general.table.header.name'), value: 'filename', sortable: false },
      { text: this.$tc('app.general.table.header.time_added'), value: 'time_added', configurable: true, sortable: false },
      { text: this.$tc('app.general.table.header.time_in_queue'), value: 'time_in_queue', configurable: true, sortable: false }
    ]
    const key = 'queue'
    return this.$store.getters['config/getMergedTableHeaders'](headers, key)
  }

  get visibleHeaders (): AppTableHeader[] {
    return this.headers.filter(header => header.visible || header.visible === undefined)
  }

  get jobs () {
    return this.$store.state.jobQueue.queued_jobs as QueuedJob[]
  }

  set jobs (val: QueuedJob[]) {
    const filenames = val.map(job => job.filename)

    SocketActions.serverJobQueueDeleteJobs(['all'])
    SocketActions.serverJobQueuePostJob(filenames)
  }

  getFilePaths (filename: string) {
    return getFilePaths(filename, 'gcodes')
  }
}
</script>
