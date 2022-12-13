<template>
  <v-toolbar dense>
    <v-spacer />

    <v-btn
      fab
      small
      text
      @click="$emit('remove')"
    >
      <v-icon>$delete</v-icon>
    </v-btn>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class JobQueueBulkActions extends Vue {
}
</script>
