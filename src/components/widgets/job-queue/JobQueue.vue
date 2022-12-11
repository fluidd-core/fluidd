<template>
  <div>
    <job-queue-browser
      :dense="dense"
      @row-click="handleRowClick"
    />

    <job-queue-context-menu
      v-if="contextMenuState.open"
      v-model="contextMenuState.open"
      :job="contextMenuState.job"
      :position-x="contextMenuState.x"
      :position-y="contextMenuState.y"
      @remove="handleRemove"
    />
  </div>
</template>

<script lang="ts">
import { SocketActions } from '@/api/socketActions'
import { QueuedJob } from '@/store/jobQueue/types'
import { Component, Prop, Vue } from 'vue-property-decorator'
import JobQueueBrowser from './JobQueueBrowser.vue'
import JobQueueContextMenu from './JobQueueContextMenu.vue'

@Component({
  components: {
    JobQueueBrowser,
    JobQueueContextMenu
  }
})
export default class JobQueue extends Vue {
  contextMenuState: any = {
    open: false,
    x: 0,
    y: 0,
    job: null
  }

  @Prop({ type: Boolean, default: false })
  readonly dense!: boolean

  handleRowClick (item: QueuedJob, e: MouseEvent) {
    if (!this.contextMenuState.open) {
      // Open the context menu
      this.contextMenuState.x = e.clientX
      this.contextMenuState.y = e.clientY
      this.contextMenuState.job = item
      this.$nextTick(() => {
        this.contextMenuState.open = true
      })
    }
  }

  handleRemove (item: QueuedJob) {
    SocketActions.serverJobQueueDeleteJobs([item.job_id])
  }
}
</script>
