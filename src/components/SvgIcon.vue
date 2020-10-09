<template>
  <v-icon>{{ svgPath }}</v-icon>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class SvgIcon extends Vue {
  @Prop({ type: Boolean })
  value!: boolean;

  get svgPath () {
    return ''
  }
}
</script>
