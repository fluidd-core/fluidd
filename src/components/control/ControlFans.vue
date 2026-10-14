<template>
  <!-- Simple: the part fan and the lights, each in a few words. -->
  <div
    v-if="!pro"
    class="fans-simple"
    :class="{ 'fans-simple--phone': phone }"
  >
    <control-card
      v-if="partFan && !phone"
      title="Part fan"
      :note="klippyReady ? 'The other fans look after themselves.' : ''"
      :locked="klippyReady ? '' : 'Klipper is not ready'"
      data-tid="control-part-fan"
    >
      <template #aside>
        <span>cools the print</span>
      </template>
      <seg-picker
        :options="fanOptions"
        :value="fanMode"
        label="Part fan"
        big
        fill
        :disabled="!klippyReady"
        @input="setFanMode"
      />
    </control-card>

    <control-card
      v-if="hasLights && !phone"
      title="Lights"
      :note="klippyReady ? 'Off while printing turns the camera dark too.' : ''"
      :locked="klippyReady ? '' : 'Klipper is not ready'"
      data-tid="control-lights"
    >
      <template #aside>
        <toggle-switch
          :value="lightsValue > 0"
          label="Lights"
          :disabled="!klippyReady"
          @input="setLights"
        />
      </template>
      <div
        v-if="dimmable"
        class="fans-simple__dim"
      >
        <frame-icon
          name="bulb"
          small
          class="fans-simple__dim-low"
        />
        <range-slider
          :value="lightsValue"
          label="Lights brightness"
          :disabled="!klippyReady"
          @change="setLights"
        />
        <frame-icon
          name="bulb"
        />
      </div>
    </control-card>

    <!-- A phone: one card, a row each. -->
    <control-card
      v-if="phone && (partFan || hasLights)"
      data-tid="control-fans-phone"
    >
      <div class="fans-simple__rows">
        <div
          v-if="partFan"
          class="crow"
        >
          <span class="crow__name">Part fan</span>
          <seg-picker
            :options="fanOptionsShort"
            :value="fanMode"
            label="Part fan"
            :disabled="!klippyReady"
            @input="setFanMode"
          />
        </div>
        <div
          v-if="hasLights"
          class="crow"
        >
          <span class="crow__name">Lights</span>
          <toggle-switch
            :value="lightsValue > 0"
            label="Lights"
            :disabled="!klippyReady"
            @input="setLights"
          />
        </div>
      </div>
    </control-card>
  </div>

  <!-- Pro: every fan, its reading, and a slider for the ones you set. -->
  <control-card
    v-else
    title="Fans and lights"
    :locked="klippyReady ? '' : 'Klipper is not ready'"
    data-tid="control-fans"
  >
    <div class="fans-pro">
      <div
        v-for="fan in fans"
        :key="fan.key"
        class="crow"
      >
        <span class="crow__name">
          {{ fan.type === 'fan' ? 'Part fan' : fan.prettyName }}
          <span
            v-if="!isSettable(fan)"
            class="crow__sub"
          > · {{ automaticLabel(fan) }}</span>
        </span>
        <range-slider
          v-if="isSettable(fan)"
          class="fans-pro__slider"
          :value="fanValue(fan)"
          :label="fan.prettyName"
          :disabled="!klippyReady"
          @change="setFan(fan, $event)"
        />
        <b class="crow__value">{{ fanValue(fan) ? `${fanValue(fan)}%` : 'off' }}</b>
      </div>
      <div
        v-if="hasLights"
        class="crow"
      >
        <span class="crow__name">Lights</span>
        <range-slider
          v-if="dimmable"
          class="fans-pro__slider"
          :value="lightsValue"
          label="Lights"
          :disabled="!klippyReady"
          @change="setLights"
        />
        <toggle-switch
          v-else
          :value="lightsValue > 0"
          label="Lights"
          :disabled="!klippyReady"
          @input="setLights"
        />
        <b class="crow__value">{{ lightsValue ? `${lightsValue}%` : 'off' }}</b>
      </div>
      <p
        v-if="!fans.length && !hasLights"
        class="fans-pro__none"
      >
        This printer has no fans or lights to set.
      </p>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import type { Fan } from '@/store/printer/types'
import ControlCard from './ControlCard.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import ToggleSwitch from './ToggleSwitch.vue'
import RangeSlider from './RangeSlider.vue'

type FanMode = 'auto' | 'on' | 'off'

/**
 * Fans and lights. Simple: the part fan as Auto (as sliced), On or Off,
 * and the lights. Pro: every fan with its reading, a slider for each one
 * you can set, and the lights' brightness.
 */
@Component({ components: { ControlCard, SegPicker, ToggleSwitch, RangeSlider } })
export default class ControlFans extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

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
  .fans-pro > .crow + .crow {
    border-top: 1px solid var(--m3d-border);
  }

  .fans-pro__slider {
    flex: 0 1 180px;
    margin-left: auto;
  }

  .fans-pro .crow__value {
    min-width: 44px;
    text-align: right;
  }

  .fans-pro__none {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
