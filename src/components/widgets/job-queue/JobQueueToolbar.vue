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
          @click="$emit('remove-all')"
          v-on="on"
        >
          <v-icon>$delete</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.remove_all') }}</span>
    </v-tooltip>

    <v-tooltip bottom>
      <template #activator="{ on, attrs }">
        <v-btn
          v-bind="attrs"
          fab
          small
          text
          @click="$emit('refresh')"
          v-on="on"
        >
          <v-icon>$refresh</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('app.general.btn.refresh') }}</span>
    </v-tooltip>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class JobQueueToolbar extends Vue {
}
</script>
