<template>
  <div class="crow">
    <span class="crow__name">{{ label }}
      <span
        v-if="previous !== null"
        class="crow__sub"
      > · was {{ previous }} {{ unit }}</span>
      <button
        v-if="previous !== null"
        type="button"
        class="tuning-value__back"
        :data-tid="`put-back-${label}`"
        :disabled="disabled"
        @click="putBack"
      >Put back</button>
    </span>
    <number-field
      :key="context"
      :value="value"
      :unit="unit"
      :min="min"
      :max="max"
      :decimals="decimals"
      :label="label"
      :disabled="disabled"
      @change="change"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import NumberField from './NumberField.vue'

@Component({ components: { NumberField } })
export default class TuningValue extends Vue {
  @Prop({ type: Number, default: null }) readonly value!: number | null
  @Prop({ type: String, required: true }) readonly label!: string
  @Prop({ type: String, default: '' }) readonly unit!: string
  @Prop({ type: Number, default: 0 }) readonly min!: number
  @Prop({ type: Number, default: Infinity }) readonly max!: number
  @Prop({ type: Number, default: 0 }) readonly decimals!: number
  @Prop({ type: Boolean }) readonly disabled?: boolean
  @Prop({ type: String, required: true }) readonly context!: string
  previous: number | null = null

  @Watch('context')
  reset () { this.previous = null }

  @Watch('disabled')
  disable (value: boolean) { if (value) this.reset() }

  change (value: number) {
    if (this.disabled || !Number.isFinite(value) || value < this.min || value > this.max) return
    if (this.previous === null) this.previous = this.value
    this.$emit('change', value)
  }

  putBack () {
    const value = this.previous
    if (value === null || this.disabled || value < this.min || value > this.max) return
    this.$emit('change', value)
    this.previous = null
  }
}
</script>

<style scoped>
.tuning-value__back { color: var(--m3d-accent); font-size: 12px; margin-left: 8px; }
</style>
