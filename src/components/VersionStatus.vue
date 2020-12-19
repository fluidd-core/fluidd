<template>
  <div>
    <v-chip v-if="!hasUpdate" x-small label outlined color="success">UP TO DATE</v-chip>
    <v-chip v-if="dirty" x-small label outlined color="error">DIRTY REPO</v-chip>
    <v-chip v-if="!valid" x-small label outlined color="error">INVALID REPO</v-chip>
    <v-btn v-if="hasUpdate && !dirty && valid" :disabled="disabled" :loading="loading" x-small text color="warning" @click="$emit('on-update')">UPDATE</v-btn>
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
