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

    <file-system
      roots="gcodes"
      dense
      :height="400"
    ></file-system>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    FileSystem
  }
})
export default class JobsCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
