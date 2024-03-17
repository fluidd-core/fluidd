<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col cols="12">
      <console-card fullscreen />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ConsoleCard from '@/components/widgets/console/ConsoleCard.vue'

@Component({
  components: {
    ConsoleCard
  }
})
export default class Console extends Vue {
}
</script>
