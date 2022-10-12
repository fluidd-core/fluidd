<template>
  <div>
    <v-chip
      v-if="!hasUpdate && (!dirty && valid)"
      small
      outlined
      :color="(disabled) ? 'grey darken-2' : 'success'"
    >
      {{ $t('app.version.label.up_to_date') }}
    </v-chip>
    <v-tooltip
      v-if="dirty && valid"
      left
    >
      <template #activator="{ on, attrs }">
        <v-chip
          v-bind="attrs"
          small
          outlined
          :disabled="disabled"
          :color="(disabled) ? 'grey darken-2' : 'error'"
          v-on="on"
        >
          {{ $t('app.version.label.dirty') }}
        </v-chip>
      </template>
      <span>{{ $t('app.version.tooltip.dirty') }}</span>
    </v-tooltip>

    <v-tooltip
      v-if="!valid"
      left
    >
      <template #activator="{ on, attrs }">
        <v-chip
          v-bind="attrs"
          small
          outlined
          :color="(disabled) ? 'grey darken-2' : 'error'"
          v-on="on"
        >
          {{ $t('app.version.label.invalid') }}
        </v-chip>
      </template>
      <span>{{ $t('app.version.tooltip.invalid') }}</span>
    </v-tooltip>

    <app-btn
      v-if="hasUpdate && !dirty && valid"
      :disabled="disabled"
      small
      text
      color="primary"
      class="ml-1"
      @click="$emit('on-update')"
    >
      {{ $t('app.version.btn.update') }}
    </app-btn>

    <app-btn
      v-if="dirty || !valid"
      small
      text
      color="error"
      class="ml-1"
      @click="$emit('on-recover')"
    >
      {{ $t('app.general.btn.recover') }}
    </app-btn>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class VersionStatus extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly hasUpdate!: boolean

  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  @Prop({ type: Boolean, default: false })
  readonly loading!: boolean

  @Prop({ type: Boolean, default: false })
  readonly dirty!: boolean

  @Prop({ type: Boolean, default: true })
  readonly valid!: boolean
}
</script>
