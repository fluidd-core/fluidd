<template>
  <v-list-item
    class="minHeight36 text-no-wrap"
  >
    <v-checkbox
      v-model="value"
      class="mt-0"
      hide-details
      :label="label"
    />
  </v-list-item>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

@Component
export default class AfcCardSettingsUnit extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  value = true

  get label (): string {
    const unitName = this.name.substring(this.name.indexOf(' ') + 1)

    return this.$t('app.afc.ShowUnit', { name: this.$filters.prettyCase(unitName) }).toString()
  }

  mounted () {
    this.value = !this.afcHiddenUnits.includes(this.name)
  }

  @Watch('value')
  onValueChange (newValue: boolean) {
    if (newValue) {
      this.removeFromHiddenUnits(this.name)
      return
    }

    this.addToHiddenUnits(this.name)
  }

  private removeFromHiddenUnits (name: string) {
    const hiddenUnits = [...this.afcHiddenUnits]
    const index = hiddenUnits.indexOf(name)
    if (index > -1) hiddenUnits.splice(index, 1)

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.hiddenUnits',
      value: hiddenUnits,
      server: true
    })
  }

  private addToHiddenUnits (name: string) {
    const hiddenUnits = [...this.afcHiddenUnits]
    if (!hiddenUnits.includes(name)) hiddenUnits.push(name)

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.hiddenUnits',
      value: hiddenUnits,
      server: true
    })
  }
}
</script>

<style scoped>
.minHeight36 {
    min-height: 36px;
}
</style>
