<template>
  <control-card
    :title="diagnosticsOnly ? 'Switches and sensors' : outputsOnly ? 'Outputs' : 'Outputs and sensors'"
    :locked="controlLock"
    data-tid="control-outputs"
  >
    <p
      v-if="outputsOnly && !outputs.length"
      class="outs__note"
    >
      This printer has no other outputs.
    </p>
    <div
      v-if="!diagnosticsOnly && outputs.length"
      class="outs__group"
    >
      <h3 class="outs__label">
        Outputs
      </h3>
      <div
        v-for="out in outputs"
        :key="out.key"
        class="crow"
      >
        <span class="crow__name">{{ out.label }}</span>
        <span
          v-if="out.dimmable"
          class="outs__slider"
        >
          <range-slider
            :value="out.percent"
            :min="0"
            :max="100"
            :label="out.label"
            :value-text-formatter="percentValueText"
            :disabled="!controlReady"
            @change="setOutput(out, $event)"
          />
          <span class="crow__value">{{ out.percent }}%</span>
        </span>
        <toggle-switch
          v-else
          :value="out.percent > 0"
          :label="out.label"
          :disabled="!controlReady"
          @input="setOutput(out, $event ? 100 : 0)"
        />
      </div>
    </div>

    <div
      v-if="!outputsOnly && sensors.length"
      class="outs__group"
      data-tid="control-sensors"
    >
      <h3 class="outs__label">
        Filament sensors
      </h3>
      <div
        v-for="sensor in sensors"
        :key="sensor.name"
        class="crow"
      >
        <span class="crow__name">
          {{ sensor.prettyName }}
          <span class="crow__sub">· {{ typeof sensor.enabled !== 'boolean' || typeof sensor.filament_detected !== 'boolean' ? 'Unknown' : !sensor.enabled ? 'off' : sensor.filament_detected ? 'filament in' : 'no filament' }}</span>
          <span
            v-if="sensor.role === 'loads'"
            class="outs__why"
          >Loads filament automatically; always on</span>
        </span>
        <span
          v-if="sensor.role === 'loads' && sensor.enabled"
          class="outs__state"
        >On</span>
        <toggle-switch
          v-else
          :value="sensor.enabled"
          :label="`${sensor.prettyName} on`"
          :disabled="!controlReady || typeof sensor.enabled !== 'boolean' || (sensor.enabled && sensor.role !== 'runout')"
          @input="setSensor(sensor.name, $event)"
        />
      </div>
    </div>

    <div
      v-if="!outputsOnly"
      class="outs__group"
      data-tid="control-endstops"
    >
      <h3 class="outs__label outs__label--row">
        Endstops
        <button
          type="button"
          class="outs__link"
          :disabled="!controlReady"
          data-tid="control-endstops-check"
          @click="checkEndstops"
        >
          {{ endstops.length ? 'Check again' : 'Check them' }}
        </button>
      </h3>
      <div
        v-for="endstop in endstops"
        :key="endstop.name"
        class="crow"
      >
        <span class="crow__name">{{ endstop.name }}</span>
        <span
          class="outs__state"
          :class="{ 'outs__state--hit': endstop.state === 'triggered' }"
        >{{ endstop.state === 'triggered' ? 'Triggered' : endstop.state === 'open' ? 'Open' : 'Unknown' }}</span>
      </div>
      <p
        v-if="!endstops.length"
        class="outs__note"
      >
        Reads each switch once, as it is now. Press one by hand and check again to see it change.
      </p>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { SocketActions } from '@/api/socketActions'
import type { Endstop, Led, OutputPin, RunoutSensor } from '@/store/printer/types'
import {
  filamentSensorRole,
  ledCommand,
  ledPercent,
  pinCommand,
  pinPercent,
  sensorCommand,
  type FilamentSensorRole,
  type SensorConfigFile
} from '@/services/control/model'
import ControlCard from './ControlCard.vue'
import RangeSlider from './RangeSlider.vue'
import ToggleSwitch from './ToggleSwitch.vue'

interface Output {
  key: string;
  label: string;
  percent: number;
  dimmable: boolean;
  pin?: OutputPin;
  led?: Led;
}

type Sensor = RunoutSensor & { prettyName: string; role: FilamentSensorRole }

/**
 * Outputs and sensors: the output pins and LEDs that aren't the
 * lights (Fans and lights has those), the filament sensors with their
 * on/off (none for a sensor that loads filament), and the endstops, read
 * when asked.
 */
@Component({ components: { ControlCard, RangeSlider, ToggleSwitch } })
export default class ControlOutputs extends Mixins(ControlMixin) {
  @Prop({ type: Boolean }) readonly outputsOnly?: boolean
  @Prop({ type: Boolean }) readonly diagnosticsOnly?: boolean
  percentValueText (value: number): string {
    return `${value} percent`
  }

  get outputs (): Output[] {
    const pins = ((this.$store.getters['printer/getPins'] as OutputPin[]) ?? [])
      .filter(p => p.controllable && p.name !== this.lightsPin?.name)
      .map(pin => ({ key: pin.key, label: pin.prettyName, percent: pinPercent(pin.value), dimmable: pin.pwm, pin }))
    const leds = ((this.$store.getters['printer/getAllLeds'] as Led[]) ?? [])
      .filter(l => l.name !== this.lightsLed?.name)
      .map(led => ({ key: led.key, label: led.prettyName, percent: ledPercent(led.color_data), dimmable: true, led }))
    return [...pins, ...leds]
  }

  setOutput (out: Output, percent: number) {
    if (!this.controlReady || !Number.isFinite(percent) || percent < 0 || percent > 100) return
    if (out.pin) this.sendGcode(pinCommand(out.pin, out.pin.pwm ? percent : percent > 0))
    else if (out.led) this.sendGcode(ledCommand(out.led.name, percent))
  }

  get configfile (): SensorConfigFile | undefined {
    return this.$store.state.printer.printer.configfile
  }

  /** Each sensor with what it is for: one that loads filament has no off. */
  get sensors (): Sensor[] {
    return ((this.$store.getters['printer/getRunoutSensors'] as Array<RunoutSensor & { prettyName: string }>) ?? [])
      .map(sensor => ({ ...sensor, role: filamentSensorRole(this.configfile, sensor.name) }))
  }

  /** Reads the printer's settings as they are now, so an off is refused however this is called. */
  setSensor (name: string, enabled: boolean) {
    if (!this.controlReady) return
    const gcode = sensorCommand(name, enabled, this.configfile)
    if (gcode) this.sendGcode(gcode)
  }

  requested = false
  requestGeneration = 0
  requestedTarget = ''
  endstopResult: Endstop[] = []

  get endstops (): Endstop[] {
    // Klipper says open, or TRIGGERED in capitals.
    return this.endstopResult.map(e => ({ name: e.name === 'Probe' ? e.name : e.name.toUpperCase(), state: String(e.state).toLowerCase() }))
  }

  async checkEndstops () {
    if (!this.controlReady) return
    const generation = ++this.requestGeneration
    const target = this.panelTarget
    this.$store.commit('printer/setClearEndStops')
    this.requested = true
    this.requestedTarget = target
    this.endstopResult = []
    const response = await SocketActions.printerQueryEndstops() as Record<string, string> | undefined
    if (generation !== this.requestGeneration || target !== this.panelTarget || target !== this.requestedTarget || !response) return
    this.endstopResult = Object.keys(response).sort().map(name => ({ name, state: response[name] }))
  }

  @Watch('panelTarget')
  clearEndstopRequest () {
    this.requestGeneration++
    this.requested = false
    this.requestedTarget = ''
    this.endstopResult = []
    this.$store.commit('printer/setClearEndStops')
  }

  /** A reading goes stale: leaving the page clears it, as Fluidd's own panel does. */
  destroyed () {
    this.$store.commit('printer/setClearEndStops')
  }
}
</script>

<style lang="scss" scoped>
  .outs__group {
    display: flex;
    flex-direction: column;

    > .crow + .crow {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .outs__label {
    margin: 0 0 4px;
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
  }

  .outs__label--row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .outs__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;

    &:disabled {
      opacity: 0.45;
    }
  }

  .outs__slider {
    display: flex;
    flex: 0 1 220px;
    align-items: center;
    gap: 10px;

    .crow__value {
      min-width: 40px;
      text-align: right;
    }
  }

  .outs__state {
    padding: 2px 10px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
  }

  .outs__why {
    display: block;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 400;
  }

  .outs__state--hit {
    background: rgba(255, 159, 10, 0.16);
    color: var(--m3d-warning, #ff9f0a);
  }

  .outs__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
