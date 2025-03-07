<template>
  <app-btn-group>
    <app-btn
      v-for="value in valuesDown"
      :key="`l${value}`"
      :color="color"
      :disabled="disabled"
      class="value"
      @click="$emit('click', -value)"
    >
      -{{ value }}
    </app-btn>

    <slot />

    <app-btn
      v-for="value in valuesUp"
      :key="`r${value}`"
      :color="color"
      :disabled="disabled"
      class="value"
      @click="$emit('click', value)"
    >
      +{{ value }}
    </app-btn>
  </app-btn-group>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class AppUpDownBtnGroup extends Vue {
  @Prop({ type: Array, required: true })
  readonly values!: number[]

  @Prop({ type: String })
  readonly color?: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  get valuesDown (): number[] {
    return [...this.values]
      .sort((a, b) => b - a)
  }

  get valuesUp (): number[] {
    return [...this.values]
      .sort((a, b) => a - b)
  }
}
</script>

<style lang="scss" scoped>
  .v-btn.value {
    min-width: 44px;
    padding: 0px;
  }
</style>
