<template>
  <v-card>
    <v-card-title
      class="card-title card-heading py-1 draggable"
    >
      {{ $t('app.general.label.drag_me') }}
    </v-card-title>
  </v-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class AppBtn extends Vue {
}
</script>
