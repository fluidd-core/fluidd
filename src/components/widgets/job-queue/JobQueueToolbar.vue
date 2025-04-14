<template>
  <v-toolbar dense>
    <v-spacer />

    <app-thumbnail-size v-model="thumbnailSize" />

    <app-column-picker
      v-if="headers"
      key-name="job_queue"
      :headers="headers"
    />

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          @click="$emit('remove-all')"
          v-on="on"
        >
          <v-icon>$delete</v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.remove_all') }}</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <app-btn
          v-bind="attrs"
          icon
          text
          @click="$emit('refresh')"
          v-on="on"
        >
          <v-icon>$refresh</v-icon>
        </app-btn>
      </template>
      <span>{{ $t('app.general.btn.refresh') }}</span>
    </v-tooltip>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { AppDataTableHeader } from '@/types'

@Component({})
export default class JobQueueToolbar extends Vue {
  @Prop({ type: Array })
  readonly headers?: AppDataTableHeader[]

  get thumbnailSize (): number {
    return this.$typedState.config.uiSettings.thumbnailSizes.jobQueue ?? 32
  }

  set thumbnailSize (value: number) {
    this.$typedDispatch('config/updateThumbnailSizes', { name: 'jobQueue', size: value })
  }
}
</script>
