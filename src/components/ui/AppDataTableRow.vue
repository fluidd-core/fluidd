<template>
  <tr
    v-bind="$attrs"
    :class="{
      'v-data-table__selected': isSelected
    }"
    v-on="$listeners"
  >
    <template v-for="header in headers">
      <td
        :key="header.value"
        :class="[
          `text-${header.align || 'start'}`,
          header.cellClass,
          {
            'v-data-table__divider': header.divider
          }
        ]"
      >
        <slot
          :name="`item.${header.value}`"
          :header="header"
          :value="getValue(header)"
        >
          <slot
            name="item.data-table-default"
            :header="header"
            :value="getValue(header)"
          >
            {{ formatValue(getValue(header)) }}
          </slot>
        </slot>
      </td>
    </template>
  </tr>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { get } from 'lodash-es'
import type { DataTableHeader } from 'vuetify'

@Component({
  inheritAttrs: false
})
export default class AppDataTableRow extends Vue {
  @Prop({ type: Array<DataTableHeader> })
  readonly headers!: DataTableHeader[]

  @Prop({ type: Object })
  readonly item!: unknown

  @Prop({ type: Boolean })
  readonly isSelected!: boolean

  getValue (header: DataTableHeader) {
    return get(this.item, header.value)
  }

  formatValue (value: unknown) {
    return value == null || value === ''
      ? '--'
      : value
  }
}
</script>
