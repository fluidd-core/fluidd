<template>
  <div class="file-system">
    <app-draggable
      v-model="jobs"
      :options="{
        group: 'jobQueue',
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
        <template #[`item.data-table-select`]="{ isSelected, select }">
          <v-simple-checkbox
            :value="isSelected"
            class="mt-1"
            @click.stop="select(!isSelected)"
          />
        </template>
        <template #[`item.handle`]>
          <app-drag-icon />
        </template>
        <template #[`item.filename`]="{ value }">
          {{ value }}
        </template>
        <template #[`item.time_added`]="{ value }">
          {{ $filters.formatAbsoluteDateTime(value * 1000) }}
        </template>
        <template #[`item.time_in_queue`]="{ value }">
          {{ $filters.formatCounterSeconds(value) }}
        </template>
      </v-data-table>
    </app-draggable>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import type { QueuedJob } from '@/store/jobQueue/types'
import { SocketActions } from '@/api/socketActions'
import StateMixin from '@/mixins/state'
import type { DataTableHeader, DataTableItemProps } from 'vuetify'

type QueueJobWithKey = QueuedJob & {
  key: string
}

@Component({})
export default class JobQueueBrowser extends Mixins(StateMixin) {
  @VModel({ type: Array<QueuedJob>, default: () => [] })
  selected!: QueuedJob[]

  @Prop({ type: Boolean })
  readonly dense?: boolean

  @Prop({ type: Boolean })
  readonly bulkActions?: boolean

  @Prop({ type: Array<DataTableHeader>, required: true })
  readonly headers!: DataTableHeader[]

  get jobs (): QueuedJob[] {
    this.selected = []

    return this.$store.state.jobQueue.queued_jobs
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

  handleRowClick (_data: unknown, props: DataTableItemProps, event: MouseEvent) {
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
</style>
