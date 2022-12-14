<template>
  <div class="file-system">
    <v-data-table
      v-sortable-data-table="{
        options:{
          animation: '200',
          handle: '.handle',
          group: 'jobQueue',
          ghostClass: 'ghost'
        },
        handler: onSorted
      }"
      item-key="job_id"
      :headers="headers"
      :items="jobs"
      :dense="dense"
      :disable-pagination="true"
      :loading="hasWait($waits.onJobQueue)"
      :show-select="bulkActions"
      mobile-breakpoint="0"
      hide-default-footer
      @sorted="jobs = $event"
      @input="$emit('update:selected', $event)"
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

  @Prop({ type: Array, required: true })
  readonly headers!: AppTableHeader[]

  get jobs () {
    return this.$store.state.jobQueue.queued_jobs as QueuedJob[]
  }

  set jobs (val: QueuedJob[]) {
    const filenames = val.map(job => job.filename)

    SocketActions.serverJobQueueDeleteJobs(['all'])
    SocketActions.serverJobQueuePostJob(filenames)
  }

  onSorted (jobs: QueuedJob[]) {
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
