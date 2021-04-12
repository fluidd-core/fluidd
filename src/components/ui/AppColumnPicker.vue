<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-x-transition"
    :min-width="150"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        :disabled="disabled"
        fab small text
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          $cogs
        </v-icon>
      </v-btn>
    </template>
    <v-list dense class="overflow-y-auto">
      <template
        v-for="header in headers"
      >
        <v-list-item
          @click="handleToggleHeader(header)"
          :key="header.value"
          v-if="header.text !== '' && header.configurable"
          link
          dense
        >
          <v-list-item-action class="my-0">
            <v-checkbox
              :input-value="header.visible"
              dense
              hide-details
              color="primary"
            ></v-checkbox>
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
import { AppTableHeader } from '@/types'

@Component({})
export default class AppColumnPicker extends Mixins(StateMixin) {
  @Prop({ type: String, required: true })
  keyName!: string;

  @Prop({ type: Array, required: true })
  headers!: AppTableHeader[]

  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  value: any[] = []

  handleToggleHeader (header: AppTableHeader) {
    header.visible = !header.visible
    this.$store.dispatch('config/updateHeader', { name: this.keyName, header })
  }
}
</script>
