<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col
      cols="12"
      :lg="hasQueuedJobs ? 8 : undefined"
    >
      <collapsable-card
        :title="$t('app.general.title.jobs')"
        card-key="JobsPage"
        icon="$files"
        :draggable="false"
        class="mb-2 mb-sm-4"
      >
        <file-system
          :roots="'gcodes'"
          name="jobs"
          bulk-actions
          :max-height="816"
        />
      </collapsable-card>
    </v-col>
    <v-col
      v-if="hasQueuedJobs"
      cols="12"
      lg="4"
    >
      <job-queue-card full-screen />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import JobQueueCard from '@/components/widgets/job-queue/JobQueueCard.vue'

@Component({
  components: {
    FileSystem,
    JobQueueCard
  }
})
export default class Configuration extends Mixins(StateMixin) {
  get supportsJobQueue (): boolean {
    return this.$store.getters['server/componentSupport']('job_queue')
  }

  get hasQueuedJobs () {
    return this.supportsJobQueue && this.$store.state.jobQueue.queued_jobs.length > 0
  }
}
</script>
