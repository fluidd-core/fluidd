<template>
  <div class="ml-3">
    <v-tooltip top>
      <template #activator="{ on, attr }">
        <span
          v-bind="attr"
          class="sensor-status rounded-circle d-inline-block mr-2"
          :class="sensorClass"
          v-on="on"
        />
      </template>
      <span>
        {{ sensorOutput }}
      </span>
    </v-tooltip>
    <span class="text-body-1">
      {{ $t('app.afc.Hub') }}
    </span>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

@Component
export default class AfcCardUnitHub extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true }) readonly name!: string

  get hub () {
    return this.getAfcHubObject(this.name)
  }

  get sensorStatus () {
    return this.hub?.state ?? false
  }

  get sensorOutput () {
    const status = this.sensorStatus ? this.$t('app.afc.Detected') : this.$t('app.afc.Empty')

    return `${this.name} ${this.$t('app.afc.HubLoad')} - ${status}`
  }

  get sensorClass () {
    return {
      success: this.sensorStatus,
      error: !this.sensorStatus,
    }
  }
}
</script>

<style scoped>
.sensor-status {
  width: 10px;
  height: 10px;
}
</style>
