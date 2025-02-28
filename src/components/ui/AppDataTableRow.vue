<template>
  <tr
    v-bind="$attrs"
    :class="{
      'v-data-table__selected': isSelected
    }"
    v-on="$listeners"
  >
    <template v-for="{ header, value } in items">
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
          :value="value"
        >
          <slot
            name="item.data-table-default"
            :header="header"
            :value="value"
          >
            {{ formatValue(value) }}
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

export type GetterFunction = (item: unknown, header: DataTableHeader, defaultGetter: DefaultGetterFunction) => unknown

const defaultGetter = (item: unknown, header: DataTableHeader): unknown => get(item, header.value)

export type DefaultGetterFunction = typeof defaultGetter

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

  @Prop({ type: Function })
  readonly customGetter?: GetterFunction

  get items () {
    const getter = this.customGetter ?? defaultGetter

    return this.headers.map(header => ({
      header,
      value: getter(this.item, header, defaultGetter)
    }))
  }

  formatValue (value: unknown) {
    return value == null || value === ''
      ? '--'
      : value
  }
}
</script>
