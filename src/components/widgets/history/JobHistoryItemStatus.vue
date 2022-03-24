<template>
  <span>
    <v-tooltip top>
      <template #activator="{ on, attrs }">
        <v-icon
          v-bind="attrs"
          small
          :color="(job.exists) ? state : 'secondary'"
          class="mr-1"
          v-on="on"
        >
          {{ icon }}
        </v-icon>
      </template>
      <span>{{ job.status }}</span>
    </v-tooltip>
  </span>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import { HistoryItem, HistoryItemStatus } from '@/store/history/types'

@Component({})
export default class JobHistoryItemStatus extends Mixins(FilesMixin) {
  @Prop({ type: Object, required: true })
  job!: HistoryItem

  // get status () {
  //   if (this.job.status === HistoryItemStatus.Completed) return HistoryItemStatus.Completed
  //   if (this.job.status === HistoryItemStatus.InProgress) return HistoryItemStatus.InProgress
  //   if (this.job.status.indexOf('_')) {
  //     return this.job.status.split('_').pop()
  //   }
  //   return this.job.status
  // }

  get icon () {
    const iconMap: { [index: string]: string } = {
      completed: '$checkedCircle',
      printing: '$inProgress',
      in_progress: '$inProgress',
      standby: '$inProgress',
      cancelled: '$cancelled'
    }

    const icon = iconMap[this.job.status]

    // Default to the warning symbol
    return icon || '$warning'
  }

  get state () {
    if (
      this.job.status === HistoryItemStatus.Cancelled ||
      this.job.status === HistoryItemStatus.Error ||
      this.job.status === HistoryItemStatus.Server_Exit
    ) return 'error'

    if (
      this.job.status === HistoryItemStatus.Printing ||
      this.job.status === HistoryItemStatus.Completed ||
      this.job.status === HistoryItemStatus.InProgress
    ) return 'success'

    if (
      this.job.status === HistoryItemStatus.Klippy_Shutdown ||
      this.job.status === HistoryItemStatus.Klippy_Disconnect
    ) return 'warning'

    return 'success'
  }

  get inError () {
    return (
      this.job.status !== HistoryItemStatus.Completed &&
      this.job.status !== HistoryItemStatus.InProgress
    )
  }
}
</script>
