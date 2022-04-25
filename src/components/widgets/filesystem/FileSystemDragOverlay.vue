<template>
  <v-overlay
    class="dragOverlay"
    :value="value"
    :opacity="0.85"
    absolute
  >
    <v-container>
      <v-row
        class="fill-height"
        align-content="center"
        justify="center"
        no-gutters
      >
        <v-col
          class="text-h6 font-weight-light text-center"
          cols="12"
          sm="6"
        >
          <v-icon x-large>
            $fileUpload
          </v-icon>
          <span v-html="$t('app.file_system.overlay.label')" />
        </v-col>
      </v-row>
    </v-container>
  </v-overlay>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class FileSystemDragOverlay extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean;
}
</script>

<style lang="scss" scoped>
  .dragOverlay.v-overlay--active {
    border: dashed 3px #616161;
  }

  .dragOverlay ::v-deep .v-overlay__content {
    width: 100%;
  }
</style>
