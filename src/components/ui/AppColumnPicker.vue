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
          <app-btn
            icon
            text
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }"
          >
            <v-icon>
              $tableColumn
            </v-icon>
          </app-btn>
        </template>
        <span>{{ $t('app.general.btn.select_columns') }}</span>
      </v-tooltip>
    </template>

    <v-list
      dense
      class="overflow-y-auto"
    >
      <app-draggable
        v-model="configurableHeaders"
        :options="{
          group: 'columnPicker',
        }"
      >
        <template v-for="header in configurableHeaders">
          <v-list-item
            :key="header.value"
            @click="handleToggleHeader(header)"
          >
            <v-list-item-action class="my-0">
              <app-drag-icon />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>{{ header.text }}</v-list-item-title>
            </v-list-item-content>
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="header.visible !== false" />
            </v-list-item-action>
          </v-list-item>
        </template>
      </app-draggable>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import type { AppDataTableHeader } from '@/types'
import type { ConfiguredTableHeader } from '@/store/config/types'

@Component({})
export default class AppColumnPicker extends Vue {
  @Prop({ type: String, required: true })
  readonly keyName!: string

  @Prop({ type: Array, required: true })
  readonly headers!: AppDataTableHeader[]

  get configurableHeaders (): AppDataTableHeader[] {
    return this.headers
  }

  set configurableHeaders (value: AppDataTableHeader[]) {
    const headers = value
      .map(({ value, visible }): ConfiguredTableHeader => ({
        value,
        visible
      }))

    this.$store.dispatch('config/updateHeaders', { name: this.keyName, headers })
  }

  handleToggleHeader (value: AppDataTableHeader) {
    const header : ConfiguredTableHeader = {
      value: value.value,
      visible: !(value.visible !== false)
    }

    this.$store.dispatch('config/updateHeader', { name: this.keyName, header })
  }
}
</script>
