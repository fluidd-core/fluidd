<template>
  <v-card
    class="filesystem-wrapper"
    :class="{ 'no-pointer-events': overlay }"
    flat
    @dragover="handleDragOver"
    @dragenter.self.prevent
    @dragleave.self.prevent="handleDragLeave"
    @drop.self.prevent="handleDrop"
  >
    <job-queue-toolbar
      v-if="selected.length === 0"
      :headers="configurableHeaders"
      @remove-all="handleRemoveAll"
      @refresh="handleRefresh"
    />

    <job-queue-bulk-actions
      v-else
      @remove="handleRemove(selected)"
      @multiply="handleMultiplyDialog(selected)"
    />

    <job-queue-browser
      v-model="selected"
      :headers="headers"
      :dense="dense"
      :bulk-actions="bulkActions"
      @row-click="handleRowClick"
    />

    <app-drag-overlay
      v-model="overlay"
      :message="$t('app.file_system.overlay.drag_files_enqueue')"
      icon="$enqueueJob"
      absolute
    />

    <job-queue-context-menu
      v-if="contextMenuState.open"
      v-model="contextMenuState.open"
      :job="contextMenuState.job"
      :position-x="contextMenuState.x"
      :position-y="contextMenuState.y"
      @remove="handleRemove"
      @multiply="handleMultiplyDialog"
    />

    <job-queue-multiply-job-dialog
      v-if="multiplyJobDialogState.open"
      v-model="multiplyJobDialogState.open"
      :job="multiplyJobDialogState.job"
      @save="handleMultiply"
    />
  </v-card>
</template>

<script lang="ts">
import { SocketActions } from '@/api/socketActions'
import type { QueuedJob } from '@/store/jobQueue/types'
import { Component, Prop, Vue } from 'vue-property-decorator'
import JobQueueToolbar from './JobQueueToolbar.vue'
import JobQueueBulkActions from './JobQueueBulkActions.vue'
import JobQueueBrowser from './JobQueueBrowser.vue'
import JobQueueContextMenu from './JobQueueContextMenu.vue'
import JobQueueMultiplyJobDialog from './JobQueueMultiplyJobDialog.vue'
import type { AppTableHeader } from '@/types'
import { getFileDataTransferDataFromDataTransfer, hasFileDataTransferTypeInDataTransfer } from '@/util/file-data-transfer'
import type { DataTableHeader } from 'vuetify'

@Component({
  components: {
    JobQueueToolbar,
    JobQueueBulkActions,
    JobQueueBrowser,
    JobQueueMultiplyJobDialog,
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

  multiplyJobDialogState: any = {
    open: false,
    job: null
  }

  selected: QueuedJob[] = []
  overlay = false

  @Prop({ type: Boolean })
  readonly dense?: boolean

  @Prop({ type: Boolean })
  readonly bulkActions?: boolean

  get configurableHeaders (): AppTableHeader[] {
    const headers: AppTableHeader[] = [
      {
        text: this.$tc('app.general.table.header.time_added'),
        value: 'time_added',
        sortable: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.general.table.header.time_in_queue'),
        value: 'time_in_queue',
        visible: false,
        sortable: false,
        cellClass: 'text-no-wrap'
      }
    ]

    const mergedTableHeaders: AppTableHeader[] = this.$store.getters['config/getMergedTableHeaders'](headers, 'job_queue')

    return mergedTableHeaders
  }

  get headers (): DataTableHeader[] {
    return [
      {
        text: '',
        value: 'handle',
        sortable: false,
        width: '24px'
      },
      {
        text: this.$tc('app.general.table.header.name'),
        value: 'filename',
        sortable: false
      },
      ...this.configurableHeaders
        .filter(header => header.visible !== false)
    ]
  }

  handleRowClick (item: QueuedJob, event: MouseEvent) {
    if (this.contextMenuState.open) {
      this.contextMenuState.open = false

      if (event.type !== 'contextmenu') {
        return
      }
    }

    if (
      this.selected.length !== 0 &&
      !this.selected.some(x => x.filename === item.filename)
    ) {
      return
    }

    // Open the context menu
    this.contextMenuState.x = event.clientX
    this.contextMenuState.y = event.clientY
    this.contextMenuState.job = this.selected.length > 1
      ? this.selected
      : item
    this.$nextTick(() => {
      this.contextMenuState.open = true
    })
  }

  async handleRemoveAll () {
    const result = await this.$confirm(
      this.$tc('app.job_queue.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      SocketActions.serverJobQueueDeleteJobs(['all'])
    }
  }

  handleRefresh () {
    SocketActions.serverJobQueueStatus()
  }

  handleRemove (jobs: QueuedJob | QueuedJob[]) {
    const jobIds = Array.isArray(jobs)
      ? jobs.map(job => job.job_id)
      : [jobs.job_id]

    SocketActions.serverJobQueueDeleteJobs(jobIds)
  }

  handleMultiplyDialog (jobs: QueuedJob | QueuedJob[]) {
    this.multiplyJobDialogState = {
      open: true,
      job: jobs
    }
  }

  handleMultiply (jobs: QueuedJob | QueuedJob[], copies: number) {
    const filenames = Array.isArray(jobs)
      ? jobs.map(job => job.filename)
      : [jobs.filename]

    const multipliedFilenames = Array.from({ length: copies })
      .map(() => filenames)
      .flat()

    SocketActions.serverJobQueuePostJob(multipliedFilenames)
  }

  handleDragOver (event: DragEvent) {
    if (
      event.dataTransfer &&
      hasFileDataTransferTypeInDataTransfer(event.dataTransfer, 'jobs')
    ) {
      event.preventDefault()

      event.dataTransfer.dropEffect = 'link'

      this.overlay = true
    }
  }

  handleDragLeave () {
    this.overlay = false
  }

  handleDrop (event: DragEvent) {
    this.overlay = false

    if (
      event.dataTransfer &&
      hasFileDataTransferTypeInDataTransfer(event.dataTransfer, 'jobs')
    ) {
      const files = getFileDataTransferDataFromDataTransfer(event.dataTransfer, 'jobs')
      const filePath = files.path ? `${files.path}/` : ''
      const filenames = files.items
        .map(file => `${filePath}${file}`)

      SocketActions.serverJobQueuePostJob(filenames)
    }
  }
}
</script>

<style lang="scss" scoped>
  .filesystem-wrapper,
  .file-system,
  .file-system :deep(.app-draggable),
  .file-system :deep(.v-data-table) {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }
</style>
