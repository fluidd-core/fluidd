<template>
  <v-toolbar dense>
    <v-spacer />

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          @click="$emit('remove')"
          v-on="on"
        >
          <v-icon>$delete</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.remove') }}</span>
    </v-tooltip>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class JobQueueBulkActions extends Vue {
}
</script>
