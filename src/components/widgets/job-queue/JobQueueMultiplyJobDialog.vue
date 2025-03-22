<template>
  <app-dialog
    v-model="open"
    :title="$tc('app.job_queue.title.multiply_job', jobCount)"
    max-width="320"
    @save="handleSave"
  >
    <v-card-text>
      <v-text-field
        v-model.number="copies"
        autofocus
        outlined
        :label="$t('app.job_queue.label.number_of_copies')"
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThanOrEqual(1)
        ]"
        required
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, VModel, Prop } from 'vue-property-decorator'
import type { QueuedJob } from '@/store/jobQueue/types'

@Component({})
export default class JobQueueMultiplyJobDialog extends Vue {
  copies = 1

  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: [Object, Array], required: true })
  readonly job!: QueuedJob | QueuedJob[]

  get jobCount () {
    return Array.isArray(this.job)
      ? this.job.length
      : 1
  }

  handleSave () {
    this.$emit('save', this.job, this.copies)
    this.open = false
  }
}
</script>
