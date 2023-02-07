<template>
  <collapsable-card
    :title="$t('app.general.title.job_queue')"
    icon="$jobQueue"
    :draggable="!fullScreen"
    :collapsable="!fullScreen"
    layout-path="dashboard.job-queue-card"
  >
    <template #menu>
      <app-btn-collapse-group :collapsed="menuCollapsed">
        <app-btn
          v-if="['ready','loading','starting'].includes(queueStatus)"
          small
          class="ma-1"
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
          class="ma-1"
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
        v-if="!fullScreen"
        color=""
        fab
        x-small
        text
        @click="$filters.routeTo($router, '/jobs')"
      >
        <v-icon>$fullScreen</v-icon>
      </app-btn>
    </template>

    <job-queue
      :dense="!fullScreen"
      :bulk-actions="fullScreen"
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
  @Prop({ type: Boolean, default: false })
  readonly menuCollapsed!: boolean

  @Prop({ type: Boolean, default: false })
  readonly fullScreen!: boolean

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
