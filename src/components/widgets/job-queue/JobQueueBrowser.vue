<template>
  <div class="file-system">
    <v-data-table
      item-key="job_id"
      :headers="visibleHeaders"
      :items="jobs"
      :dense="dense"
      :disable-pagination="true"
      :loading="hasWait($waits.onJobQueue)"
      :show-select="bulkActions"
      mobile-breakpoint="0"
      hide-default-footer
      @input="$emit('update:selected', $event)"
    >
      <template #body="props">
        <tbody v-if="props.items.length === 0">
          <tr class="v-data-table__empty-wrapper">
            <td :colspan="bulkActions ? 5 : 4">
              <span>{{ $t('app.file_system.msg.not_found') }}</span>
            </td>
          </tr>
        </tbody>
        <draggable
          v-else
          v-model="jobs"
          tag="tbody"
          animation="200"
          handle=".handle"
          group="jobQueue"
          ghost-class="ghost"
        >
          <tr
            v-for="item in props.items"
            :key="item.job_id"
            class="row-select"
            @click.prevent="$emit('row-click', item, $event)"
            @contextmenu.prevent="$emit('row-click', item, $event)"
          >
            <td v-if="bulkActions">
              <v-simple-checkbox
                v-if="item.name !== '..'"
                v-ripple
                :value="props.isSelected(item)"
                color=""
                class="mt-1"
                @click.stop="props.select(item, !props.isSelected(item))"
              />
            </td>
            <td>
              <v-icon
                class="handle"
                left
              >
                $drag
              </v-icon>
            </td>
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
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { QueuedJob } from '@/store/jobQueue/types'
import { SocketActions } from '@/api/socketActions'
import { AppTableHeader } from '@/types'
import draggable from 'vuedraggable'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    draggable
  }
})
export default class JobQueueBrowser extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  readonly dense!: boolean

  @Prop({ type: Boolean, default: false })
  readonly bulkActions!: boolean

  get headers (): AppTableHeader[] {
    const headers = [
      { text: '', value: 'drag', sortable: false, width: '24px' },
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
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  // Lighten up dark mode checkboxes.
  .theme--dark :deep(.v-simple-checkbox .v-icon) {
    color: rgba(map-deep-get($material-dark, 'inputs', 'box'), 0.25);
  }
</style>
