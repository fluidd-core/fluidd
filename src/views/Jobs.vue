<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col
      cols="12"
      :lg="hasQueuedJobs ? 8 : undefined"
    >
      <jobs-card fullscreen />
    </v-col>
    <v-col
      v-if="hasQueuedJobs"
      cols="12"
      lg="4"
    >
      <job-queue-card fullscreen />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import JobsCard from '@/components/widgets/jobs/JobsCard.vue'
import JobQueueCard from '@/components/widgets/job-queue/JobQueueCard.vue'

@Component({
  components: {
    JobsCard,
    JobQueueCard
  }
})
export default class Configuration extends Mixins(StateMixin) {
  get supportsJobQueue (): boolean {
    return this.$store.getters['server/componentSupport']('job_queue')
  }

  get hasQueuedJobs () {
    return this.supportsJobQueue && this.$store.state.jobQueue.queuedJobs.length > 0
  }
}
</script>
