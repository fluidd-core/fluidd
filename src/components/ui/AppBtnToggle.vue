<template>
  <v-btn-toggle
    v-bind="$attrs"
    :class="{
      'elevation-2': !disabled
    }"
    v-on="$listeners"
  >
    <slot />
  </v-btn-toggle>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppBtn extends Vue {
  @Prop({ type: Boolean })
  disabled?: boolean
}
</script>
