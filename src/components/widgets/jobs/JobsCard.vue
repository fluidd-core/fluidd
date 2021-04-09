<template>
  <collapsable-card
    :title="$t('app.general.title.jobs')"
    icon="$files"
    :draggable="true"
    :layout-path="`dashboard.${$options.name}`">

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
