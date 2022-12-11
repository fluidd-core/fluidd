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
        <app-btn
          small
          class="ma-1"
          @click="handleRefresh"
        >
          <v-icon
            small
            left
          >
            $refresh
          </v-icon>
          <span>{{ $t('app.general.btn.refresh') }}</span>
        </app-btn>
        <app-btn
          small
          class="ma-1"
          @click="handleRemoveAll"
        >
          <v-icon
            small
            left
          >
            $delete
          </v-icon>
          <span>{{ $t('app.general.btn.remove_all') }}</span>
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
    return this.$store.state.jobQueue.queue_status
  }

  async handleRemoveAll () {
    const res = await this.$confirm(
      this.$tc('app.job_queue.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (res) {
      SocketActions.serverJobQueueDeleteJobs(['all'])
    }
  }

  handleRefresh () {
    SocketActions.serverJobQueueStatus()
  }

  handlePause () {
    SocketActions.serverJobQueuePause()
  }

  handleResume () {
    SocketActions.serverJobQueueStart()
  }
}
</script>
