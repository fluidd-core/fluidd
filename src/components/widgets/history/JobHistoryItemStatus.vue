<template>
  <v-chip
    small
    color="secondary"
  >
    <v-icon
      small
      left
      :color="color"
    >
      {{ icon }}
    </v-icon>
    <span class="grey--text">{{ job.status }}</span>
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

  get icon () {
    if (!this.inError) {
      return '$check'
    }
    return '$close'
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
