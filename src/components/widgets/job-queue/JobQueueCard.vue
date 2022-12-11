<template>
  <collapsable-card
    :title="$t('app.general.title.queue')"
    icon="$list"
    :lazy="false"
    :draggable="true"
    layout-path="dashboard.job-queue-card"
  >
    <job-queue />
    <template #menu>
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
    </template>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import JobQueue from '@/components/widgets/job-queue/JobQueue.vue'
import { SocketActions } from '@/api/socketActions'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    JobQueue
  }
})
export default class JobQueueCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  readonly enabled!: boolean

  async handleRemoveAll () {
    const res = await this.$confirm(
      this.$tc('app.queue.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (res) {
      SocketActions.serverJobQueueDeleteJob('all')
    }
  }

  get queueStatus () {
    return this.$store.state.jobQueue.queue_status
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
