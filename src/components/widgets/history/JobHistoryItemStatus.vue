<template>
  <v-chip
    small
  >
    <v-icon
      small
      :left="status.length > 0"
      :color="color"
    >
      {{ icon }}
    </v-icon>
    <span class="grey--text">{{ status }}</span>
  </v-chip>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FilesMixin from '@/mixins/files'
import { HistoryItem, HistoryItemStatus } from '@/store/history/types'

@Component({})
export default class JobHistoryItemStatus extends Mixins(FilesMixin) {
  @Prop({ type: Object, required: true })
  job!: HistoryItem

  get status () {
    if (this.job.status === HistoryItemStatus.Completed) return ''
    if (this.job.status === HistoryItemStatus.InProgress) return 'in progress'
    if (this.job.status.indexOf('_')) {
      return this.job.status.split('_').pop()
    }
    return this.job.status
  }

  get icon () {
    if (!this.inError) {
      return '$check'
    }
    return '$error'
  }

  get color () {
    if (!this.inError) {
      return 'success'
    }
    return 'error'
  }

  get inError () {
    return (
      this.job.status !== HistoryItemStatus.Completed &&
      this.job.status !== HistoryItemStatus.Standby &&
      this.job.status !== HistoryItemStatus.InProgress
    )
  }
}
</script>
