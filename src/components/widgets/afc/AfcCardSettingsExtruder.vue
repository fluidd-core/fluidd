<template>
  <v-list-item @click="showExtruder = !showExtruder">
    <v-list-item-action class="my-0">
      <v-checkbox :input-value="showExtruder" />
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
export default class AfcCardSettingsExtruder extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  get label (): string {
    return this.$t('app.afc.ShowTool', { name: this.$filters.prettyCase(this.name) }).toString()
  }

  get showExtruder () {
    return !this.afcHiddenExtruders
      .includes(this.name)
  }

  set showExtruder (value: boolean) {
    const values = new Set(this.afcHiddenExtruders)

    if (value) {
      values.delete(this.name)
    } else {
      values.add(this.name)
    }

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.hiddenExtruders',
      value: [...values],
      server: true
    })
  }
}
</script>
