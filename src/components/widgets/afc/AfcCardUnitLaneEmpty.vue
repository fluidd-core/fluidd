<template>
  <div class="d-flex flex-column flex-grow-1">
    <v-row class="mt-0 flex-grow-1">
      <v-col
        class="align-content-center text-center text--disabled px-6"
        :class="{ 'pb-6': !prep, 'pt-3': !prep }"
      >
        {{ text }}
      </v-col>
    </v-row>
    <v-row
      v-if="prep"
      class="mt-0 flex-grow-0"
    >
      <v-col class="px-6 pb-6">
        <v-tooltip top>
          <template #activator="{ on, attrs }">
            <v-btn
              dense
              small
              class="flex elevation-0"
              v-bind="attrs"
              v-on="on"
              @click="ejectLane"
            >
              <v-icon small>
                $afcEjectFilament
              </v-icon>
            </v-btn>
          </template>
          <span>
            {{ $t('app.afc.EjectFilament') }}
          </span>
        </v-tooltip>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component
export default class AfcCardUnitLaneEmpty extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  get lane () {
    return this.getAfcLaneObject(this.name)
  }

  get prep (): boolean {
    return this.lane?.prep === true
  }

  get text (): string {
    if (this.prep) return this.$t('app.afc.PrepDetected').toString()

    return this.$t('app.afc.Empty').toString()
  }

  ejectLane () {
    this.sendGcode(`LANE_UNLOAD LANE=${encodeGcodeParamValue(this.name)}`)
  }
}
</script>
