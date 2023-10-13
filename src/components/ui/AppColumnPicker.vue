<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    min-width="150"
    :close-on-content-click="false"
  >
    <template #activator="{ on: menu, attrs }">
      <v-tooltip bottom>
        <template #activator="{ on: tooltip }">
          <v-btn
            :disabled="disabled"
            fab
            small
            text
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }"
          >
            <v-icon>
              $tableColumn
            </v-icon>
          </v-btn>
        </template>
        <span>{{ $t('app.general.btn.select_columns') }}</span>
      </v-tooltip>
    </template>
    <v-list
      dense
      class="overflow-y-auto"
    >
      <template v-for="header in headers">
        <v-list-item
          v-if="header.text !== '' && header.configurable"
          :key="header.value"
          @click="handleToggleHeader(header)"
        >
          <v-list-item-action class="my-0">
            <v-checkbox :input-value="header.visible" />
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ header.text }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { AppTableHeader } from '@/types'

@Component({})
export default class AppColumnPicker extends Mixins(StateMixin) {
  @Prop({ type: String, required: true })
  readonly keyName!: string

  @Prop({ type: Array, required: true })
  readonly headers!: AppTableHeader[]

  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  value: any[] = []

  handleToggleHeader (header: AppTableHeader) {
    header.visible = !header.visible
    this.$store.dispatch('config/updateHeader', { name: this.keyName, header })
  }
}
</script>
