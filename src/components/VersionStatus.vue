<template>
  <div>
    <v-chip v-if="!hasUpdate && (!dirty && valid)" x-small label outlined color="success">{{$t('versionStatus.updated.msg')}}</v-chip>
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
          {{$t('versionStatus.dirty.msg')}}
        </v-chip>
      </template>
      <span>{{$t('versionStatus.dirty.desc')}}</span>
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
          {{$t('versionStatus.invalid.msg')}}
        </v-chip>
      </template>
      <span>{{$t('versionStatus.invalid.desc')}}</span>
    </v-tooltip>

    <btn
      v-if="hasUpdate && !dirty && valid"
      :disabled="disabled"
      :loading="loading"
      x-small
      text
      color="warning"
      @click="$emit('on-update')">
      {{$t('versionStatus.update.msg')}}
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
