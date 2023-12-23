<template>
  <collapsable-card
    :title="$t('app.general.title.job_queue')"
    icon="$jobQueue"
    :draggable="!fullscreen"
    :collapsable="!fullscreen"
    layout-path="dashboard.job-queue-card"
    :help-tooltip="$t('app.job_queue.tooltip.help')"
  >
    <template #menu>
      <app-btn-collapse-group :collapsed="menuCollapsed">
        <app-btn
          v-if="['ready','loading','starting'].includes(queueStatus)"
          small
          class="ms-1 my-1"
          @click="handlePause"
        >
          <v-icon
            small
            left
          >
            $pause
          </v-icon>
          <span>{{ $t('app.general.btn.pause') }}</span>
        </app-btn>
        <app-btn
          v-else-if="queueStatus === 'paused'"
          small
          class="ms-1 my-1"
          @click="handleResume"
        >
          <v-icon
            small
            left
          >
            $resume
          </v-icon>
          <span>{{ $t('app.general.btn.resume') }}</span>
        </app-btn>
      </app-btn-collapse-group>

      <app-btn
        v-if="!fullscreen"
        color=""
        fab
        x-small
        text
        class="ms-1 my-1"
        @click="$filters.routeTo($router, '/jobs')"
      >
        <v-icon>$fullScreen</v-icon>
      </app-btn>
    </template>

    <job-queue
      :dense="!fullscreen"
      :bulk-actions="fullscreen"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import JobQueue from '@/components/widgets/job-queue/JobQueue.vue'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: {
    JobQueue
  }
})
export default class JobQueueCard extends Vue {
  @Prop({ type: Boolean })
  readonly menuCollapsed?: boolean

  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  get queueStatus () {
    return this.$store.state.jobQueue.queue_state
  }

  handlePause () {
    SocketActions.serverJobQueuePause()
  }

  handleResume () {
    SocketActions.serverJobQueueStart()
  }
}
</script>
