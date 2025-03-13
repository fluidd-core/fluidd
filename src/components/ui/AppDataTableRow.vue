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
          <template v-if="isEmpty(value)">
            --
          </template>
          <template v-else-if="Array.isArray(value) && value.length > 0">
            <slot
              :name="`item-value.${header.value}`"
              :header="header"
              :value="value"
            >
              <v-chip
                v-for="(arrayItem, index) in value"
                :key="index"
                :class="{
                  'ms-1': index > 0
                }"
                small
              >
                {{ isEmpty(arrayItem) ? '--' : arrayItem }}
              </v-chip>
            </slot>
          </template>
          <template v-else>
            <slot
              :name="`item-value.${header.value}`"
              :header="header"
              :value="value"
            >
              {{ value }}
            </slot>
          </template>
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
  @Prop({ type: Array, required: true })
  readonly headers!: DataTableHeader[]

  @Prop({ type: Object, required: true })
  readonly item!: unknown

  @Prop({ type: Boolean })
  readonly isSelected!: boolean

  @Prop({ type: Function })
  readonly customGetter?: GetterFunction

  isEmpty (value: unknown) {
    return (
      value == null ||
      value === '' ||
      (
        Array.isArray(value) &&
        value.length === 0
      )
    )
  }

  get items () {
    const getter = this.customGetter ?? defaultGetter

    return this.headers.map(header => ({
      header,
      value: getter(this.item, header, defaultGetter)
    }))
  }
}
</script>
