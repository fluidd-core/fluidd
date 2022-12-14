<template>
  <div class="file-system">
    <v-data-table
      v-model="selected"
      v-sortable-data-table="{
        options:{
          animation: '200',
          handle: '.handle',
          group: 'jobQueue',
          ghostClass: 'ghost'
        },
        handler: handleSorted
      }"
      item-key="job_id"
      :headers="headers"
      :items="jobs"
      :dense="dense"
      :disable-pagination="true"
      :loading="hasWait($waits.onJobQueue)"
      :show-select="bulkActions"
      :no-data-text="$t('app.file_system.msg.not_found')"
      :no-results-text="$t('app.file_system.msg.not_found')"
      mobile-breakpoint="0"
      hide-default-footer
      @sorted="jobs = $event"
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
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import { QueuedJob } from '@/store/jobQueue/types'
import { SocketActions } from '@/api/socketActions'
import { AppTableHeader } from '@/types'
import draggable from 'vuedraggable'
import StateMixin from '@/mixins/state'
import { DataTableItemProps } from 'vuetify'
import { SortableEvent } from 'sortablejs'

@Component({
  components: {
    draggable
  }
})
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

  set jobs (val: QueuedJob[]) {
    const filenames = val.map(job => job.filename)

    SocketActions.serverJobQueueDeleteJobs(['all'])
    SocketActions.serverJobQueuePostJob(filenames)
  }

  handleRowClick (_data: any, props: DataTableItemProps, event: MouseEvent) {
    this.$emit('row-click', props.item, event)
  }

  handleContextMenu (event: MouseEvent, props: DataTableItemProps) {
    this.$emit('row-click', props.item, event)
  }

  handleSorted (event: SortableEvent) {
    if (event.oldIndex === undefined || event.newIndex === undefined) {
      return
    }

    const jobs = this.jobs

    const movedItem = jobs.splice(event.oldIndex, 1)[0]
    jobs.splice(event.newIndex, 0, movedItem)

    this.jobs = jobs
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
