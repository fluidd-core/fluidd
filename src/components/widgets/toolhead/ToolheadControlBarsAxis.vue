<template>
  <v-row
    no-gutters
    class="mb-2"
  >
    <v-col>
      <app-up-down-btn-group
        :values="values"
        color="primary"
        :disabled="!klippyReady || printerPrinting || !homed"
        class="d-flex"
        @click="sendMoveGcode($event)"
      >
        <app-btn
          :color="!homed ? 'primary' : undefined"
          :loading="hasWait(wait)"
          class="flex-grow-1"
          @click="sendHomeGcode"
        >
          <v-icon
            small-icon
            class="mr-1"
          >
            $home
          </v-icon>
          {{ axis }}
        </app-btn>
      </app-up-down-btn-group>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

type Axis = 'X' | 'Y' | 'Z'

@Component({})
export default class ToolheadControlBarsAxis extends Mixins(StateMixin, ToolheadMixin) {
  @Prop({ type: String })
  readonly axis!: Axis

  get values (): number[] {
    return this.axis === 'Z'
      ? this.$store.state.config.uiSettings.general.toolheadZMoveDistances
      : this.$store.state.config.uiSettings.general.toolheadXYMoveDistances
  }

  get homed (): boolean {
    switch (this.axis) {
      case 'X':
        return this.xHomed
      case 'Y':
        return this.yHomed
      case 'Z':
        return this.zHomed
    }
  }

  get wait (): string {
    switch (this.axis) {
      case 'X':
        return this.$waits.onHomeX
      case 'Y':
        return this.$waits.onHomeY
      case 'Z':
        return this.$waits.onHomeZ
    }
  }

  get rate (): number {
    return this.axis === 'Z'
      ? this.$store.state.config.uiSettings.general.defaultToolheadZSpeed
      : this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed
  }

  sendMoveGcode (distance: number) {
    this.sendGcode(`G91
    G1 ${this.axis}${distance} F${this.rate * 60}
    G90`)
  }

  sendHomeGcode () {
    this.sendGcode(`G28 ${this.axis}`, this.wait)
  }
}
</script>
