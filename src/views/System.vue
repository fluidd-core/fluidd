<template>
  <v-row :dense="$vuetify.breakpoint.smAndDown">
    <v-col
      cols="12"
      md="6"
    >
      <system-overview-card class="mb-2 mb-sm-4" />
      <disk-usage-card />
    </v-col>

    <v-col
      cols="12"
      md="6"
    >
      <system-usage-card class="mb-2 mb-sm-4" />
      <template
        v-for="mcu in mcus"
      >
        <mcu-card
          :key="mcu.name"
          :mcu="mcu"
          class="mb-2 mb-sm-4"
        />
      </template>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'

import SystemOverviewCard from '@/components/widgets/system/SystemOverviewCard.vue'
import McuCard from '@/components/widgets/system/McuCard.vue'
import SystemUsageCard from '@/components/widgets/system/SystemUsageCard.vue'
import DiskUsageCard from '@/components/widgets/system/DiskUsageCard.vue'

@Component({
  components: {
    FileSystem,
    SystemOverviewCard,
    McuCard,
    SystemUsageCard,
    DiskUsageCard
  }
})
export default class Configure extends Mixins(StateMixin) {
  get breakpoint () {
    if (this.$vuetify.breakpoint.mdAndDown) {
      return 12
    }
    return 6
  }

  get mcus () {
    return this.$store.getters['printer/getMcus']
  }
}
</script>
