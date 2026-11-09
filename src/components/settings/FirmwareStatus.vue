<template>
  <div>
    <v-chip
      v-if="state === 'current'"
      small
      outlined
      :color="disabled ? 'grey darken-2' : 'success'"
      class="ml-1"
    >
      {{ $t('app.firmware.state.current') }}
    </v-chip>

    <app-btn
      v-else-if="updatable"
      :disabled="disabled"
      small
      text
      color="primary"
      class="ml-1"
      @click="$emit('on-update')"
    >
      {{ $t('app.firmware.btn.update') }}
    </app-btn>

    <v-tooltip
      v-else
      :disabled="!message"
      left
    >
      <template #activator="{ on, attrs }">
        <v-chip
          v-bind="attrs"
          small
          outlined
          color="grey darken-2"
          class="ml-1"
          v-on="on"
        >
          {{ stateLabel }}
        </v-chip>
      </template>
      <span>{{ message }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { isUpdatable } from '@/store/firmware/helpers'

@Component({})
export default class FirmwareStatus extends Vue {
  @Prop({ type: String, required: true })
  readonly state!: string

  @Prop({ type: Array, default: () => [] })
  readonly actions!: string[]

  @Prop({ type: String, default: '' })
  readonly message!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  get updatable (): boolean {
    return isUpdatable({
      state: this.state,
      actions: this.actions
    })
  }

  get stateLabel (): string {
    const key = `app.firmware.state.${this.state}`

    return this.$te(key)
      ? this.$t(key).toString()
      : this.state
  }
}
</script>
