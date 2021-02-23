<template>
  <collapsable-card
    title="Jobs"
    icon="$files"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">

    <template v-slot:title v-if="!enabled">
      <v-icon left>$files</v-icon>
      <span class="font-weight-light">Jobs</span>
      <inline-help
        type="warning"
        bottom
        small
        tooltip="Jobs are disabled prior to initial communcation with klippy"
      ></inline-help>

    </template>

    <file-system-card
      v-if="gCodeRootReady"
      root="gcodes"
      accept=".gcode,.ufp"
      dense
      :height="400"
      :show-title="false"
      :show-meta-data="false"
      :upload-and-print="true"
    ></file-system-card>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FileSystemCard from '@/components/cards/FileSystemCard.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    FileSystemCard
  }
})
export default class JobsCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get gCodeRootReady (): boolean {
    return this.$store.getters['files/isRootAvailable']('gcodes')
  }

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
