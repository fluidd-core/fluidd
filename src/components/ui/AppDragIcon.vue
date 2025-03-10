<template>
  <div class="handle-container">
    <v-icon :disabled="disabled">
      $drag
    </v-icon>
    <div
      v-if="!disabled"
      class="handle"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class AppDraggable extends Vue {
  @Prop({ type: Boolean })
  readonly disabled?: boolean
}
</script>

<style lang="scss" scoped>
  .handle-container {
    display: inline-flex;
    position: relative;
    width: 24px;
    height: 24px;
    align-items: center;
    vertical-align: middle;
  }

  .handle {
    position: absolute;
    width: 34px;
    height: 34px;
    left: -12px;
    top: calc(50% - 24px);
    margin: 7px;
    border-radius: 50%;
    cursor: grab;
  }

  .app-draggable__chosen .handle {
    cursor: grabbing;
  }
</style>
