<template>
  <app-dialog
    v-model="show"
    :title="$t('app.afc.FilamentForLane', { name: $filters.prettyCase(name) })"
    width="400"
    :save-button-text="$t('app.afc.SetSpool')"
    :save-button-disabled="disableSetBtn"
    @save="setSpool"
  >
    <v-card-text class="pb-0">
      <app-setting
        :title="$t('app.afc.Material')"
        :sub-title="$t('app.afc.MaterialSubtitle')"
      >
        <v-text-field
          v-model="material"
          placeholder="ABS"
          dense
          outlined
          hide-details
        />
      </app-setting>
      <v-divider class="my-3" />
      <app-setting
        :title="$t('app.afc.Weight')"
        :sub-title="$t('app.afc.WeightSubtitle')"
      >
        <v-text-field
          v-model.number="weight"
          placeholder="1000"
          dense
          outlined
          type="number"
          :min="0"
          :step="1"
          hide-details
        />
      </app-setting>
      <template v-if="hasSpoolTempMacro">
        <v-divider class="my-3" />
        <app-setting
          :title="$t('app.afc.ExtruderTemp')"
          :sub-title="$t('app.afc.ExtruderTempSubtitle')"
        >
          <v-text-field
            v-model.number="extruderTemp"
            placeholder="220"
            dense
            outlined
            type="number"
            :min="0"
            :step="1"
            hide-details
          />
        </app-setting>
        <template v-if="hasBedTemp">
          <v-divider class="my-3" />
          <app-setting
            :title="$t('app.afc.BedTemp')"
            :sub-title="$t('app.afc.BedTempSubtitle')"
          >
            <v-text-field
              v-model.number="bedTemp"
              placeholder="60"
              dense
              outlined
              type="number"
              :min="0"
              :step="1"
              hide-details
            />
          </app-setting>
        </template>
      </template>
      <v-divider class="my-3" />
      <v-color-picker
        hide-mode-switch
        mode="hexa"
        :value="color"
        class="mx-auto"
        @update:color="setColor"
      />
      <template v-if="hasSpoolId">
        <v-divider class="my-3" />
        <v-checkbox
          v-model="clearSpoolId"
          class="mt-0"
          hide-details
          :label="$t('app.afc.ClearSpoolId')"
        />
      </template>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { Debounce } from 'vue-debounce-decorator'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import type { GcodeCommands } from '@/store/printer/types'

@Component({})
export default class AfcUnitLaneFilamentDialog extends Mixins(StateMixin, AfcMixin) {
  @VModel({ type: Boolean })
  show!: boolean

  @Prop({ type: String, required: true })
  readonly name!: string

  color = '#000000'
  material = ''
  weight = 0
  extruderTemp = 0
  bedTemp: number | null = null
  clearSpoolId = false

  get lane () {
    return this.getAfcLaneObject(this.name)
  }

  get hasSpoolId (): boolean {
    return this.lane?.spool_id != null
  }

  get hasBedTemp (): boolean {
    return this.lane?.bed_temp != null
  }

  get availableCommands (): GcodeCommands {
    return this.$typedGetters['printer/getAvailableCommands']
  }

  get hasSpoolTempMacro (): boolean {
    return 'AFC_SET_SPOOL_TEMP' in this.availableCommands
  }

  get currentColor (): string {
    return this.lane?.color ?? '#000000'
  }

  get currentMaterial (): string {
    return this.lane?.material ?? ''
  }

  get currentWeight (): number {
    return Math.round(this.lane?.weight ?? 0)
  }

  get currentExtruderTemp (): number {
    return Math.round(this.lane?.extruder_temp ?? 0)
  }

  get currentBedTemp (): number | null {
    return this.hasBedTemp
      ? Math.round(this.lane!.bed_temp!)
      : null
  }

  get disableSetBtn (): boolean {
    return (
      !this.material ||
      !this.weight ||
      this.weight < 0 ||
      !this.color ||
      !Number.isFinite(this.extruderTemp) ||
      this.extruderTemp < 0 ||
      (this.bedTemp !== null && (!Number.isFinite(this.bedTemp) || this.bedTemp < 0))
    )
  }

  @Debounce(500)
  setColor (newColor: { hex: string }) {
    this.color = newColor.hex
  }

  setSpool () {
    const gcode: string[] = []

    if (this.clearSpoolId) {
      gcode.push(`SET_SPOOL_ID LANE=${encodeGcodeParamValue(this.name)} SPOOL_ID=`)
    }

    if (this.clearSpoolId || this.color !== this.currentColor) {
      const cleanedColor = this.color.substring(1)
      gcode.push(`SET_COLOR LANE=${encodeGcodeParamValue(this.name)} COLOR=${encodeGcodeParamValue(cleanedColor)}`)
    }

    if (this.clearSpoolId || this.material !== this.currentMaterial) {
      gcode.push(`SET_MATERIAL LANE=${encodeGcodeParamValue(this.name)} MATERIAL=${encodeGcodeParamValue(this.material)}`)
    }

    if (this.clearSpoolId || this.weight !== this.currentWeight) {
      gcode.push(`SET_WEIGHT LANE=${encodeGcodeParamValue(this.name)} WEIGHT=${this.weight}`)
    }

    if (
      this.hasSpoolTempMacro &&
      (
        this.clearSpoolId ||
        this.extruderTemp !== this.currentExtruderTemp ||
        this.bedTemp !== this.currentBedTemp
      )
    ) {
      // Only include BED_TEMP parameter if the lane reports a bed_temp
      const bedTempParam = this.bedTemp !== null ? ` BED_TEMP=${this.bedTemp}` : ''
      gcode.push(`AFC_SET_SPOOL_TEMP LANE=${encodeGcodeParamValue(this.name)}${bedTempParam} EXTRUDER_TEMP=${this.extruderTemp}`)
    }

    this.sendGcode(gcode.join('\n'))

    this.show = false
  }

  @Watch('show')
  onShowChange (newValue: boolean) {
    if (!newValue) return

    this.color = this.currentColor
    this.material = this.currentMaterial
    this.weight = this.currentWeight
    this.extruderTemp = this.currentExtruderTemp
    this.bedTemp = this.currentBedTemp
    this.clearSpoolId = false
  }
}
</script>
