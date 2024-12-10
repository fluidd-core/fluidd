<template>
  <v-toolbar dense>
    <v-spacer />

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
import type { AppTableHeader } from '@/types'

@Component({})
export default class JobQueueToolbar extends Vue {
  @Prop({ type: Array<AppTableHeader> })
  readonly headers?: AppTableHeader[]
}
</script>
