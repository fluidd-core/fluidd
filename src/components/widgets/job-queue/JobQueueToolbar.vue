<template>
  <v-toolbar dense>
    <v-spacer />

    <v-btn
      fab
      small
      text
      @click="$emit('remove-all')"
    >
      <v-icon>$delete</v-icon>
    </v-btn>

    <v-btn
      fab
      small
      text
      @click="$emit('refresh')"
    >
      <v-icon>$refresh</v-icon>
    </v-btn>
  </v-toolbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class JobQueueToolbar extends Vue {
}
</script>
