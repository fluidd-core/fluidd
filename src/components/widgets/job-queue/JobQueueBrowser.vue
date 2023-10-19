<template>
  <div class="file-system">
    <app-draggable
      v-model="jobs"
      :options="{
        animation: '200',
        handle: '.handle',
        group: 'jobQueue',
        ghostClass: 'ghost',
      }"
      target="tbody"
    >
      <v-data-table
        v-model="selected"
        item-key="key"
        :headers="headers"
        :items="jobsWithKey"
        :dense="dense"
        :loading="hasWait($waits.onJobQueue)"
        :show-select="bulkActions"
        :no-data-text="$t('app.file_system.msg.not_found')"
        :no-results-text="$t('app.file_system.msg.not_found')"
        mobile-breakpoint="0"
        hide-default-footer
        disable-pagination
        disable-sort
        fixed-header
        @click:row="handleRowClick"
        @contextmenu:row.prevent="handleContextMenu"
      >
        <template #[`item.handle`]>
          <v-icon
            class="handle"
            left
          >
            $drag
          </v-icon>
        </template>
        <template #[`item.filename`]="{ item }">
          <span>
            {{ item.filename }}
          </span>
        </template>
        <template #[`item.time_added`]="{ item }">
          <span class="text-no-wrap">
            {{ $filters.formatAbsoluteDateTime(item.time_added * 1000) }}
          </span>
        </template>
        <template #[`item.time_in_queue`]="{ item }">
          <span class="text-no-wrap">
            {{ $filters.formatCounterTime(item.time_in_queue) }}
          </span>
        </template>
      </v-data-table>
    </app-draggable>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import type { QueuedJob } from '@/store/jobQueue/types'
import { SocketActions } from '@/api/socketActions'
import type { AppTableHeader } from '@/types'
import StateMixin from '@/mixins/state'
import type { DataTableItemProps } from 'vuetify'

type QueueJobWithKey = QueuedJob & {
  key: string
}

@Component({})
export default class JobQueueBrowser extends Mixins(StateMixin) {
  @VModel({ type: Array, default: [] })
    selected!: any[]

  @Prop({ type: Boolean, default: false })
  readonly dense!: boolean

  @Prop({ type: Boolean, default: false })
  readonly bulkActions!: boolean

  @Prop({ type: Array, required: true })
  readonly headers!: AppTableHeader[]

  get jobs () {
    this.selected = []

    return this.$store.state.jobQueue.queued_jobs as QueuedJob[]
  }

  set jobs (value: QueuedJob[]) {
    const filenames = value
      .map(job => job.filename)

    if (this.$store.getters['server/getIsMinApiVersion']('1.1.0')) {
      SocketActions.serverJobQueuePostJob(filenames, true)
    } else {
      SocketActions.serverJobQueueDeleteJobs(['all'])
      SocketActions.serverJobQueuePostJob(filenames)
    }
  }

  get jobsWithKey (): QueueJobWithKey[] {
    const refresh = Date.now()

    return this.jobs
      .map(job => ({
        ...job,
        key: `${job.job_id}-${refresh}`
      }))
  }

  handleRowClick (_data: any, props: DataTableItemProps, event: MouseEvent) {
    this.$emit('row-click', props.item, event)
  }

  handleContextMenu (event: MouseEvent, props: DataTableItemProps) {
    this.$emit('row-click', props.item, event)
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  // Lighten up dark mode checkboxes.
  .theme--dark :deep(.v-simple-checkbox .v-icon) {
    color: rgba(map-deep-get($material-dark, 'inputs', 'box'), 0.25);
  }

  .handle {
    cursor: pointer;
  }
</style>
