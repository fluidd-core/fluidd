<template>
  <control-card
    title="Fans and lights"
    :locked="controlLock"
    data-tid="control-fans"
  >
    <div
      v-if="partFan"
      class="crow"
    >
      <span class="crow__name">Part fan <span class="crow__sub">cools the print</span></span>
      <seg-picker
        :options="fanOptions"
        :value="fanMode"
        label="Part fan"
        :disabled="!controlReady"
        @input="setFanMode"
      />
    </div>
    <p
      v-if="partFan"
      class="fans__none"
    >
      Auto follows the next fan command in the print; On and Off set it now.
    </p>
    <div
      v-if="hasLights"
      class="crow"
    >
      <span class="crow__name">Lights</span>
      <toggle-switch
        :value="lightsValue > 0"
        label="Lights"
        :disabled="!controlReady"
        @input="setLights"
      />
    </div>
    <control-task-fold
      fold-key="fans.all"
      :title="otherOutputCount ? 'All fans and outputs' : 'All fans'"
      :summary="`${fans.length} fans${otherOutputCount ? ` · ${otherOutputCount} outputs` : ''} · brightness`"
    >
      <div
        v-for="fan in fans"
        :key="fan.key"
        class="crow"
      >
        <span class="crow__name">{{ fan.type === 'fan' ? 'Part fan' : fan.prettyName }}<span
          v-if="!isSettable(fan)"
          class="crow__sub"
        > · {{ automaticLabel(fan) }}</span></span>
        <range-slider
          v-if="isSettable(fan)"
          class="fans__slider"
          :value="fanValue(fan)"
          :label="fan.prettyName"
          :disabled="!controlReady"
          @change="setFan(fan, $event)"
        />
        <b class="crow__value">{{ fanValue(fan) ? `${fanValue(fan)}%` : 'off' }}</b>
      </div>
      <div
        v-if="hasLights && dimmable"
        class="crow"
      >
        <span class="crow__name">Lights brightness</span>
        <range-slider
          class="fans__slider"
          :value="lightsValue"
          label="Lights brightness"
          :disabled="!controlReady"
          @change="setLights"
        />
      </div>
      <control-outputs outputs-only />
    </control-task-fold>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import type { Fan, Led, OutputPin } from '@/store/printer/types'
import ControlCard from './ControlCard.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import RangeSlider from './RangeSlider.vue'
import ControlTaskFold from './ControlTaskFold.vue'
import ControlOutputs from './ControlOutputs.vue'

type FanMode = 'auto' | 'on' | 'off'

/**
 * Part fan and lights up front; automatic fans, brightness and outputs one step away.
 */
@Component({ components: { ControlCard, SegPicker, ToggleSwitch, RangeSlider, ControlTaskFold, ControlOutputs } })
export default class ControlFans extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  get otherOutputCount (): number {
    const pins = ((this.$store.getters['printer/getPins'] as OutputPin[]) ?? []).filter(p => p.controllable && p.name !== this.lightsPin?.name)
    const leds = ((this.$store.getters['printer/getAllLeds'] as Led[]) ?? []).filter(l => l.name !== this.lightsLed?.name)
    return pins.length + leds.length
  }

  get fanOptions (): SegOption[] {
    return [
      { value: 'auto', label: 'Auto', sub: 'as sliced', title: 'While it prints, the print sets the fan' },
      { value: 'on', label: 'On', sub: '100%' },
      { value: 'off', label: 'Off', sub: '0%' }
    ]
  }

  get fanOptionsShort (): SegOption[] {
    return this.fanOptions.map(o => ({ value: o.value, label: o.label, title: o.title }))
  }

  /** Printing, the print sets the fan unless it was turned fully on or off. */
  get fanMode (): FanMode {
    const percent = this.partFan ? this.fanValue(this.partFan) : 0
    if (this.busy && percent > 0 && percent < 100) return 'auto'
    if (percent >= 100) return 'on'
    if (percent <= 0) return this.busy ? 'auto' : 'off'
    return 'auto'
  }

  setFanMode (mode: FanMode) {
    if (!this.partFan || mode === 'auto') return
    this.setFan(this.partFan, mode === 'on' ? 100 : 0)
  }

  get dimmable (): boolean {
    return this.lightsPin ? this.lightsPin.pwm : !!this.lightsLed
  }

  isSettable (fan: Fan): boolean {
    return fan.type === 'fan' || fan.type === 'fan_generic'
  }

  automaticLabel (fan: Fan): string {
    if (fan.type === 'heater_fan') return 'with the nozzle heater'
    if (fan.type === 'controller_fan') return 'with the motors'
    if (fan.type === 'temperature_fan') return typeof fan.target === 'number' ? `holds ${Math.round(fan.target)}°` : 'by temperature'
    return 'automatic'
  }
}
</script>

<style lang="scss" scoped>
  .fans-simple {
    display: contents;
  }

  .fans-simple__dim {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--m3d-text-muted);
  }

  .fans-simple__dim-low {
    opacity: 0.6;
  }

  .fans-simple__rows > .crow + .crow,
  .fans > .crow + .crow {
    border-top: 1px solid var(--m3d-border);
  }

  .fans__slider {
    flex: 0 1 180px;
    margin-left: auto;
  }

  .fans .crow__value {
    min-width: 44px;
    text-align: right;
  }

  .fans__none {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
