<template>
  <div>
    <v-chip
      v-if="!hasUpdate && (!dirty && valid)"
      x-small
      label
      outlined
      color="success"
    >{{ $t('app.version.label.up_to_date') }}</v-chip>
    <v-tooltip left>
      <template v-slot:activator="{ on, attrs }">
        <v-chip
          v-if="dirty && valid"
          v-bind="attrs"
          v-on="on"
          x-small
          label
          outlined
          color="error">
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
          x-small
          label
          outlined
          color="error">
          {{ $t('app.version.label.invalid') }}
        </v-chip>
      </template>
      <span>{{ $t('app.version.tooltip.invalid') }}</span>
    </v-tooltip>

    <btn
      v-if="hasUpdate && !dirty && valid"
      :disabled="disabled"
      :loading="loading"
      x-small
      text
      color="warning"
      @click="$emit('on-update')">
      {{ $t('app.version.btn.update') }}
    </btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class AppDrawer extends Vue {
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
