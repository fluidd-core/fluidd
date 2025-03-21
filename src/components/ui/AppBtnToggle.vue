<template>
  <v-btn-toggle
    v-model="inputValue"
    :class="{
      'elevation-2': !disabled
    }"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot />
  </v-btn-toggle>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppBtnToggle extends Vue {
  @VModel()
  inputValue?: unknown

  @Prop({ type: Boolean })
  disabled?: boolean
}
</script>
