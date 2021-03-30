<template>
  <div>
    <v-chip
      v-if="!hasUpdate && (!dirty && valid)"
      small
      outlined
      :color="(disabled) ? 'grey darken-2' : 'success'"
    >{{ $t('app.version.label.up_to_date') }}</v-chip>
    <v-tooltip left>
      <template v-slot:activator="{ on, attrs }">
        <v-chip
          v-if="dirty && valid"
          v-bind="attrs"
          v-on="on"
          small
          outlined
          :disabled="disabled"
          :color="(disabled) ? 'grey darken-2' : 'error'">
          {{ $t('app.version.label.dirty') }}
        </v-chip>
      </template>
      <span>{{ $t('app.version.tooltip.dirty') }}</span>
    </v-tooltip>

    <v-tooltip left>
      <template v-slot:activator="{ on, attrs }">
        <v-chip
          v-if="!valid"
          v-bind="attrs"
          v-on="on"
          small
          outlined
          :color="(disabled) ? 'grey darken-2' : 'error'">
          {{ $t('app.version.label.invalid') }}
        </v-chip>
      </template>
      <span>{{ $t('app.version.tooltip.invalid') }}</span>
    </v-tooltip>

    <app-btn
      v-if="hasUpdate && !dirty && valid"
      :disabled="disabled"
      small
      color="primary"
      @click="$emit('on-update')">
      {{ $t('app.version.btn.update') }}
    </app-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class VersionStatus extends Vue {
  @Prop({ type: Boolean, default: false })
  hasUpdate!: boolean

  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  @Prop({ type: Boolean, default: false })
  loading!: boolean

  @Prop({ type: Boolean, default: false })
  dirty!: boolean

  @Prop({ type: Boolean, default: true })
  valid!: boolean
}
</script>
