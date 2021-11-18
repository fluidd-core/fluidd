<template>
  <collapsable-card
    :title="$t('app.general.title.queue')"
    icon="$history">
    <job-queue></job-queue>

    <template v-slot:menu>
        <app-btn
          @click="handlePause"
          small
          class="ma-1"
          v-if="['ready','loading','starting'].includes(queueStatus)">
          <v-icon small left>$pause</v-icon>
          <span>{{ $t('app.general.btn.pause') }}</span>
        </app-btn>
        <app-btn
          @click="handleResume"
          small
          class="ma-1"
          v-else-if="queueStatus == 'paused'">
          <v-icon small left>$resume</v-icon>
          <span>{{ $t('app.general.btn.resume') }}</span>
        </app-btn>
        <app-btn
          @click="handleLoadAll"
          small
          class="ma-1">
          <v-icon small left>$refresh</v-icon>
          <span>{{ $t('app.general.btn.refresh') }}</span>
        </app-btn>
        <app-btn
          @click="handleRemoveAll"
          small
          class="ma-1">
          <v-icon small left>$delete</v-icon>
          <span>{{ $t('app.general.btn.remove_all') }}</span>
        </app-btn>
    </template>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import JobQueue from '@/components/widgets/queue/JobQueue.vue'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: {
    JobQueue
  }
})
export default class JobQueueCard extends Vue {
  handleRemoveAll () {
    this.$confirm(
      this.$tc('app.queue.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          SocketActions.jobQueueRemoveJob('all')
          SocketActions.jobQueueList()
        }
      })
  }

  get queueStatus () {
    const status = this.$store.getters['files/getQueue'].status
    console.log(status)
    return status
  }

  handleLoadAll () {
    SocketActions.jobQueueList()
  }

  handlePause () {
    SocketActions.pauseJobQueue()
  }

  handleResume () {
    SocketActions.resumeJobQueue()
  }
}
</script>
