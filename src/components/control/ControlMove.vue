<template>
  <control-card
    title="Move"
    :locked="lockReason"
    :note="note"
    data-tid="control-move"
  >
    <template #aside>
      <span
        v-if="!phone && !pro"
        class="move__step-label"
      >Step</span>
      <seg-picker
        :options="stepOptions"
        :value="step"
        label="Step"
        :disabled="!ready"
        @input="step = $event"
      />
    </template>

    <div
      class="move__body"
      :class="{ 'move__body--phone': phone }"
    >
      <div
        ref="pad"
        class="move__pad"
        :class="{ 'move__pad--off': !xyHomedHere || !ready }"
        :style="{ aspectRatio: aspect }"
        tabindex="0"
        role="application"
        aria-label="The plate, to scale. Click to move the head there; arrow keys step it."
        data-tid="move-pad"
        @click="onPadClick"
        @keydown="onPadKey"
      >
        <span class="move__watermark">MUON3D</span>
        <span
          v-if="xyHomedHere"
          class="move__head"
          :style="{ left: `${headX}%`, top: `${headY}%` }"
        />
        <button
          v-for="arrow in arrows"
          :key="arrow.id"
          type="button"
          class="move__arrow"
          :class="`move__arrow--${arrow.id}`"
          :aria-label="arrow.label"
          :disabled="!canMoveXY"
          @click.stop="moveBy(arrow.axis, arrow.sign * step)"
        >
          <frame-icon
            :name="arrow.icon"
            small
          />
        </button>
        <span
          v-if="!phone"
          class="move__caption"
        >The plate, to scale</span>
        <span
          v-if="xyHomedHere"
          class="move__where"
        >X {{ fmt(position[0]) }} · Y {{ fmt(position[1]) }}</span>
        <div
          v-if="ready && !xyHomedHere"
          class="move__home-first"
        >
          <span>Home X and Y to move the head</span>
          <button
            type="button"
            class="cbtn cbtn--primary"
            :disabled="busy"
            @click.stop="home('XY')"
          >
            Home X Y
          </button>
        </div>
      </div>

      <div
        v-if="!phone"
        class="move__plate"
      >
        <span class="move__plate-label">Plate</span>
        <button
          type="button"
          class="move__round"
          aria-label="Plate up"
          :disabled="!canMoveZ"
          @click="moveBy('Z', step)"
        >
          <frame-icon
            name="chevronUp"
            small
          />
        </button>
        <div class="move__track">
          <span
            class="move__thumb"
            :style="{ bottom: `${zFraction}%` }"
          />
        </div>
        <button
          type="button"
          class="move__round"
          aria-label="Plate down"
          :disabled="!canMoveZ"
          @click="moveBy('Z', -step)"
        >
          <frame-icon
            name="chevronDown"
            small
          />
        </button>
        <span class="move__z">Z {{ isHomed('Z') ? fmt(position[2]) : '?' }}</span>
      </div>
    </div>

    <div
      v-if="pro && !phone"
      class="move__exact"
    >
      <label
        v-for="(axis, i) in ['X', 'Y', 'Z']"
        :key="axis"
        class="move__exact-field"
      >
        <span>{{ axis }}</span>
        <number-field
          :value="goTo[i] !== null ? goTo[i] : position[i]"
          :decimals="2"
          :min="axisMin[i]"
          :max="axisMax[i]"
          :label="`${axis} to go to`"
          :disabled="!ready || busy || !isHomed(axis)"
          @change="setGoTo(i, $event)"
        />
      </label>
      <button
        type="button"
        class="cbtn"
        :disabled="!ready || busy || !hasGoTo"
        data-tid="move-go"
        @click="go"
      >
        Go
      </button>
    </div>

    <div class="move__actions">
      <template v-if="phone">
        <button
          type="button"
          class="cbtn"
          :disabled="!canMoveZ"
          @click="moveBy('Z', step)"
        >
          Plate up
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="!ready || busy"
          @click="home()"
        >
          Home
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="!canMoveZ"
          @click="moveBy('Z', -step)"
        >
          Plate down
        </button>
      </template>
      <template v-else>
        <button
          type="button"
          class="cbtn"
          :disabled="!ready || busy"
          data-tid="home-xy"
          @click="home('XY')"
        >
          <v-progress-circular
            v-if="homing('XY')"
            indeterminate
            size="14"
            width="2"
          />
          Home X Y
        </button>
        <button
          type="button"
          class="cbtn"
          :disabled="!ready || busy"
          data-tid="home-z"
          @click="home('Z')"
        >
          <v-progress-circular
            v-if="homing('Z')"
            indeterminate
            size="14"
            width="2"
          />
          Home Z
        </button>
        <button
          type="button"
          class="cbtn cbtn--ghost"
          :disabled="!ready || busy"
          data-tid="motors-off"
          @click="motorsOff"
        >
          Motors off
        </button>
        <span class="move__keys">
          <template v-if="pro">
            Homed <b class="move__homed">{{ homedAxes || 'none' }}</b> · moves at {{ xySpeed }} mm/s · plate at {{ zSpeed }} mm/s
          </template>
          <template v-else>Arrow keys move · PgUp / PgDn move the plate</template>
        </span>
      </template>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { plateToPosition } from '@/services/control/model'
import ControlCard from './ControlCard.vue'
import SegPicker, { type SegOption } from './SegPicker.vue'
import NumberField from './NumberField.vue'

type Axis = 'X' | 'Y' | 'Z'

/**
 * The head over the plate, to scale: click where it should go, or step it
 * with the arrows; the plate (Z) beside it. Nothing moves until X and Y
 * (or Z) are homed, and nothing moves while a print runs.
 */
@Component({ components: { ControlCard, SegPicker, NumberField } })
export default class ControlMove extends Mixins(ControlMixin) {
  @Prop({ type: Boolean })
  readonly phone?: boolean

  step = 10
  goTo: Array<number | null> = [null, null, null]

  get ready (): boolean {
    return this.klippyReady
  }

  get lockReason (): string {
    if (!this.ready) return 'Klipper is not ready'
    if (this.busy) return 'Not while printing: moving the head would ruin the print'
    return ''
  }

  get note (): string {
    return ''
  }

  get stepOptions (): SegOption[] {
    const steps = this.phone ? [1, 10, 50] : this.pro ? [0.1, 1, 10, 50, 100] : [0.1, 1, 10, 50]
    return steps.map((s, i) => ({ value: s, label: i === steps.length - 1 && !this.phone && !this.pro ? `${s} mm` : String(s) }))
  }

  get xyHomedHere (): boolean {
    return this.isHomed('XY')
  }

  get canMoveXY (): boolean {
    return this.ready && !this.busy && this.xyHomedHere
  }

  get canMoveZ (): boolean {
    return this.ready && !this.busy && this.isHomed('Z')
  }

  /** The plate's shape, so the pad is drawn to scale. */
  get aspect (): string {
    const w = this.axisMax[0] - this.axisMin[0]
    const h = this.axisMax[1] - this.axisMin[1]
    return w > 0 && h > 0 ? `${w} / ${h}` : '1 / 1'
  }

  get headX (): number {
    return (this.position[0] - this.axisMin[0]) / Math.max(1, this.axisMax[0] - this.axisMin[0]) * 100
  }

  get headY (): number {
    return 100 - (this.position[1] - this.axisMin[1]) / Math.max(1, this.axisMax[1] - this.axisMin[1]) * 100
  }

  get zFraction (): number {
    return (this.position[2] - this.axisMin[2]) / Math.max(1, this.axisMax[2] - this.axisMin[2]) * 100
  }

  get arrows () {
    return [
      { id: 'up', axis: 'Y' as Axis, sign: 1, icon: 'chevronUp', label: 'Head back (Y+)' },
      { id: 'down', axis: 'Y' as Axis, sign: -1, icon: 'chevronDown', label: 'Head forward (Y−)' },
      { id: 'left', axis: 'X' as Axis, sign: -1, icon: 'chevronLeft', label: 'Head left (X−)' },
      { id: 'right', axis: 'X' as Axis, sign: 1, icon: 'chevronRight', label: 'Head right (X+)' }
    ]
  }

  fmt (n: number): string {
    return (Math.round(n * 10) / 10).toFixed(1)
  }

  onPadClick (event: MouseEvent) {
    if (!this.canMoveXY) return
    const pad = this.$refs.pad as HTMLElement
    const r = pad.getBoundingClientRect()
    const [x, y] = plateToPosition((event.clientX - r.left) / r.width, (event.clientY - r.top) / r.height, this.axisMin, this.axisMax)
    this.moveTo({ X: x, Y: y })
  }

  /** Arrow keys step the head, PgUp and PgDn the plate; Shift is ten steps. */
  onPadKey (event: KeyboardEvent) {
    const by = this.step * (event.shiftKey ? 10 : 1)
    const keys: Record<string, [Axis, number]> = {
      ArrowUp: ['Y', by],
      ArrowDown: ['Y', -by],
      ArrowLeft: ['X', -by],
      ArrowRight: ['X', by],
      PageUp: ['Z', by],
      PageDown: ['Z', -by]
    }
    const move = keys[event.key]
    if (!move) return
    event.preventDefault()
    if (move[0] === 'Z' ? this.canMoveZ : this.canMoveXY) this.moveBy(move[0], move[1])
  }

  setGoTo (i: number, value: number) {
    this.goTo.splice(i, 1, value)
  }

  get hasGoTo (): boolean {
    return this.goTo.some(v => v !== null)
  }

  go () {
    const [X, Y, Z] = this.goTo
    this.moveTo({ X: X ?? undefined, Y: Y ?? undefined, Z: Z ?? undefined })
    this.goTo = [null, null, null]
  }
}
</script>

<style lang="scss" scoped>
  .move__step-label {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .move__body {
    display: flex;
    gap: 16px;
    min-width: 0;
  }

  .move__pad {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    max-height: 420px;
    overflow: hidden;
    border-radius: 16px;
    background:
      linear-gradient(var(--m3d-border) 1px, transparent 1px) 0 0 / 100% 10%,
      linear-gradient(90deg, var(--m3d-border) 1px, transparent 1px) 0 0 / 10% 100%,
      var(--m3d-surface-2);
    box-shadow: inset 0 0 0 1px var(--m3d-border);
    cursor: crosshair;

    &:focus-visible {
      outline: none;
      box-shadow: inset 0 0 0 2px var(--m3d-accent);
    }
  }

  .move__pad--off {
    cursor: default;
  }

  .move__watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    color: var(--m3d-text);
    font-family: var(--m3d-font-display, sans-serif);
    font-size: clamp(16px, 4vw, 30px);
    letter-spacing: 0.24em;
    opacity: 0.06;
    transform: translate(-50%, -50%);
    pointer-events: none;
    white-space: nowrap;
  }

  .move__head {
    position: absolute;
    width: 26px;
    height: 26px;
    margin: -13px 0 0 -13px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 0 6px rgb(255 255 255 / 12%), 0 2px 6px rgb(0 0 0 / 50%);
    transition: left 300ms var(--m3d-ease), top 300ms var(--m3d-ease);
    pointer-events: none;
  }

  .move__arrow {
    position: absolute;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    box-shadow: 0 1px 3px rgb(0 0 0 / 30%);

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }

    &:hover:not(:disabled) {
      background: var(--m3d-border-strong);
    }
  }

  .move__arrow--up { top: 12px; left: 50%; transform: translateX(-50%); }
  .move__arrow--down { bottom: 12px; left: 50%; transform: translateX(-50%); }
  .move__arrow--left { top: 50%; left: 12px; transform: translateY(-50%); }
  .move__arrow--right { top: 50%; right: 12px; transform: translateY(-50%); }

  .move__caption,
  .move__where {
    position: absolute;
    bottom: 14px;
    color: var(--m3d-text-muted);
    font-size: 12px;
    pointer-events: none;
  }

  .move__caption {
    left: 14px;
  }

  .move__where {
    right: 14px;
    font-family: var(--m3d-font-mono);
  }

  .move__home-first {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: color-mix(in srgb, var(--m3d-surface-2) 70%, transparent);
    color: var(--m3d-text);
    font-size: 14px;
    cursor: default;
  }

  .move__plate {
    display: flex;
    flex: none;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    width: 72px;
  }

  .move__plate-label {
    color: var(--m3d-text-muted);
    font-size: 12px;
  }

  .move__round {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  .move__track {
    position: relative;
    flex: 1 1 auto;
    width: 8px;
    min-height: 120px;
    border-radius: 4px;
    background: var(--m3d-surface-2);
  }

  .move__thumb {
    position: absolute;
    left: 50%;
    width: 32px;
    height: 8px;
    margin-bottom: -4px;
    border-radius: 4px;
    background: #fff;
    transform: translateX(-50%);
    transition: bottom 300ms var(--m3d-ease);
  }

  .move__z {
    font-size: 15px;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .move__exact {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .move__exact :deep(.numfield) {
    min-width: 0;
    width: 88px;
  }

  .move__exact-field {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 13px;
  }

  .move__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .move__body--phone + .move__actions .cbtn {
    flex: 1 1 0;
  }

  .move__keys {
    margin-left: auto;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .move__homed {
    color: var(--m3d-accent);
  }
</style>
