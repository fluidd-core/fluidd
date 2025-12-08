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
          v-model="weight"
          placeholder="1000"
          dense
          outlined
          type="number"
          :min="0"
          :step="1"
          hide-details
        />
      </app-setting>
      <v-divider class="my-3" />
      <v-color-picker
        hide-mode-switch
        mode="hexa"
        :value="color"
        class="mx-auto"
        @update:color="setColor"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { Debounce } from 'vue-debounce-decorator'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component({})
export default class AfcUnitLaneFilamentDialog extends Mixins(StateMixin, AfcMixin) {
  @VModel({ type: Boolean })
  show!: boolean

  @Prop({ type: String, required: true })
  readonly name!: string

  color = '#000000'
  material = ''
  weight = 0

  get lane () {
    return this.getAfcLaneObject(this.name)
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

  get disableSetBtn (): boolean {
    return (
      !this.material ||
      !this.weight ||
      !this.color
    )
  }

  @Debounce(500)
  setColor (newColor: any) {
    this.color = newColor.hex
  }

  setSpool () {
    const gcode = []

    if (this.color !== this.currentColor) {
      const cleanedColor = this.color.substring(1)
      gcode.push(`SET_COLOR LANE=${encodeGcodeParamValue(this.name)} COLOR=${encodeGcodeParamValue(cleanedColor)}`)
    }

    if (this.material !== this.currentMaterial) {
      gcode.push(`SET_MATERIAL LANE=${encodeGcodeParamValue(this.name)} MATERIAL=${encodeGcodeParamValue(this.material)}`)
    }

    if (this.weight !== this.currentWeight) {
      gcode.push(`SET_WEIGHT LANE=${encodeGcodeParamValue(this.name)} WEIGHT=${this.weight}`)
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
  }
}
</script>
