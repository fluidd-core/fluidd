<template>
  <v-snackbar
    :value="stalled"
    timeout="-1"
    multi-line
    elevation="24"
    bottom
    right
  >
    <v-progress-circular
      indeterminate
      size="20"
      width="2"
      class="mr-3"
    />
    {{ $t('app.socket.msg.stalled') }}
  </v-snackbar>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class SocketStalledSnackbar extends Vue {
  get stalled (): boolean {
    return this.$typedState.socket.stalled
  }
}
</script>
