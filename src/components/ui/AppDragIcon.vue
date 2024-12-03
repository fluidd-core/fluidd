<template>
  <div class="handle-container">
    <v-icon>
      $drag
    </v-icon>
    <div
      class="handle"
      :style="{
        cursor: cursor
      }"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class AppDraggable extends Vue {
  @Prop({ type: String, default: 'ns-resize' })
  readonly cursor?: string
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
  }
</style>
