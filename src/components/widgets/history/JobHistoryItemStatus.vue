<template>
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
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import type { HistoryItem } from '@/store/history/types'

type JobHistoryItemState = 'error' | 'warning' | 'success' | 'info'

@Component({})
export default class JobHistoryItemStatus extends Mixins(FilesMixin) {
  @Prop({ type: Object, required: true })
  readonly job!: HistoryItem

  get icon () {
    const iconMap: Record<string, string> = {
      completed: '$checkedCircle',
      printing: '$inProgress',
      in_progress: '$inProgress',
      standby: '$inProgress',
      cancelled: '$cancelled',
      interrupted: '$cancelled'
    }

    const icon = iconMap[this.job.status]

    // Default to the warning symbol
    return icon || '$warning'
  }

  get state (): JobHistoryItemState {
    switch (this.job.status) {
      case 'cancelled':
      case 'error':
      case 'interrupted':
      case 'server_exit':
        return 'error'

      case 'klippy_shutdown':
      case 'klippy_disconnect':
        return 'warning'

      case 'completed':
        return 'success'

      case 'printing':
      case 'in_progress':
        return 'info'

      default:
        return 'success'
    }
  }

  get inError () {
    return (
      this.job.status !== 'completed' &&
      this.job.status !== 'in_progress'
    )
  }
}
</script>
