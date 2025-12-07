<template>
  <v-list-item @click="showUnit = !showUnit">
    <v-list-item-action class="my-0">
      <v-checkbox :input-value="showUnit" />
    </v-list-item-action>
    <v-list-item-content>
      <v-list-item-title>
        {{ label }}
      </v-list-item-title>
    </v-list-item-content>
  </v-list-item>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

@Component
export default class AfcCardSettingsUnit extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  get label (): string {
    const unitName = this.name.substring(this.name.indexOf(' ') + 1)

    return this.$t('app.afc.ShowUnit', { name: this.$filters.prettyCase(unitName) }).toString()
  }

  get showUnit () {
    return !this.afcHiddenUnits
      .includes(this.name)
  }

  set showUnit (value: boolean) {
    const values = new Set(this.afcHiddenUnits)

    if (value) {
      values.delete(this.name)
    } else {
      values.add(this.name)
    }

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.hiddenUnits',
      value: [...values],
      server: true
    })
  }
}
</script>
