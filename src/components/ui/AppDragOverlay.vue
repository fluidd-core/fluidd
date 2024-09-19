<template>
  <v-overlay
    v-bind="$attrs"
    class="dragOverlay"
    :value="value"
    :opacity="0.85"
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
          <v-icon
            x-large
            class="mr-1"
          >
            {{ icon }}
          </v-icon>
          <span v-html="message" />
        </v-col>
      </v-row>
    </v-container>
  </v-overlay>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class AppDragOverlay extends Vue {
  @Prop({ type: Boolean })
  readonly value?: boolean

  @Prop({ type: String, required: true })
  readonly message!: string

  @Prop({ type: String, required: true })
  readonly icon!: string
}
</script>

<style lang="scss" scoped>
  .dragOverlay.v-overlay--active {
    border: dashed 3px #616161;
    pointer-events: none !important;
  }

  .dragOverlay :deep(.v-overlay__content) {
    width: 100%;
  }
</style>
