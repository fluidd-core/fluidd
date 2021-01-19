<template>
  <div>
    <v-chip v-if="!hasUpdate && (!dirty && valid)" x-small label outlined color="success">{{ $t('UP TO DATE') }}</v-chip>
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
          {{ $t('DIRTY') }}
        </v-chip>
      </template>
      <span>{{ $t('indicates local changes to the repo') }}</span>
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
          {{ $t('INVALID') }}
        </v-chip>
      </template>
      <span>{{ $t('indicates a detached head, not on master or an invalid origin') }}</span>
    </v-tooltip>

    <btn
      v-if="hasUpdate && !dirty && valid"
      :disabled="disabled"
      :loading="loading"
      x-small
      text
      color="warning"
      @click="$emit('on-update')">
      {{ $t('UPDATE') }}
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
