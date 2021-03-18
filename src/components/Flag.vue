<template>
  <span
    v-if="iso"
    class="flag-icon"
    :class="flagIconClass"
    :title="title || iso"
    :style="flagIconStyle"
  />
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({})
export default class FlashMessage extends Vue {
  @Prop({ type: String, default: null })
  iso!: string;

  @Prop({ type: String, default: null })
  title!: string;

  @Prop({ type: Boolean, default: true })
  squared!: boolean;

  @Prop({ type: Number, default: 16 })
  size!: number;

  get flagIconClass () {
    return ((this.squared) ? 'flag-icon-squared ' : '') + 'flag-icon-' + this.iso.toLowerCase()
  }

  get flagIconStyle () {
    return 'font-size: ' + this.size + 'px'
  }
}
</script>
