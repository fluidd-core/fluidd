<template>
  <td
    v-if="isVisible"
    :nowrap="nowrap"
    :class="{ 'text-end': right }"
  >
    <slot />
    <span v-if="!$slots.default">--</span>
  </td>
</template>

<script lang="ts">
import { AppTableHeader } from '@/types'
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class FileRowItem extends Vue {
  @Prop({ type: String, required: false })
  itemValue!: string

  /**
   * Optionally pass a key to define how we lookup this header item.
   */
  @Prop({ type: String, required: false })
  itemKey!: string

  @Prop({ type: Array, required: false })
  headers!: AppTableHeader[]

  @Prop({ type: Boolean, default: true })
  nowrap!: boolean

  @Prop({ type: Boolean, default: false })
  right!: boolean

  /**
   * Self check if it should appear or not based on the headers
   * collection and provided name. If either are not provided,
   * don't check.
   */
  get isVisible () {
    if (this.headers !== undefined && this.itemValue !== undefined) {
      const i = this.headers.findIndex(header => {
        const headerKey = (header.key) ? header.key : header.value
        return this.itemValue === headerKey
      })
      return (i >= 0)
    }
    return true
  }
}
</script>
