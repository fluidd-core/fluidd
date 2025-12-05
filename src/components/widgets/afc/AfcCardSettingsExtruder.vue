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
export default class AfcCardSettingsExtruder extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true }) readonly name!: string

  value = true

  get label (): string {
    return this.$t('app.afc.ShowTool', { name: this.name }).toString()
  }

  mounted () {
    this.value = !this.afcHiddenExtruders.includes(this.name)
  }

  @Watch('value')
  onValueChange (newValue: boolean) {
    if (newValue) {
      this.removeFromHiddenExtruders(this.name)
      return
    }

    this.addToHiddenExtruders(this.name)
  }

  private removeFromHiddenExtruders (name: string) {
    const hiddenExtruders = [...this.afcHiddenExtruders]
    const index = hiddenExtruders.indexOf(name)
    if (index > -1) hiddenExtruders.splice(index, 1)

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.hiddenExtruders',
      value: hiddenExtruders,
      server: true
    })
  }

  private addToHiddenExtruders (name: string) {
    const hiddenExtruders = [...this.afcHiddenExtruders]
    if (!hiddenExtruders.includes(name)) hiddenExtruders.push(name)

    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.hiddenExtruders',
      value: hiddenExtruders,
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
