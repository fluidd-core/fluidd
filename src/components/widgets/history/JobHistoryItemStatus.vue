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
import type { HistoryItem } from '@/store/history/types'

@Component({})
export default class JobHistoryItemStatus extends Mixins(FilesMixin) {
  @Prop({ type: Object, required: true })
  readonly job!: HistoryItem

  // get status () {
  //   if (this.job.status === 'completed') return 'completed'
  //   if (this.job.status === 'in_progress') return 'in_progress'
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
      this.job.status === 'cancelled' ||
      this.job.status === 'error' ||
      this.job.status === 'server_exit'
    ) return 'error'

    if (
      this.job.status === 'printing' ||
      this.job.status === 'completed' ||
      this.job.status === 'in_progress'
    ) return 'success'

    if (
      this.job.status === 'klippy_shutdown' ||
      this.job.status === 'klippy_disconnect'
    ) return 'warning'

    return 'success'
  }

  get inError () {
    return (
      this.job.status !== 'completed' &&
      this.job.status !== 'in_progress'
    )
  }
}
</script>
