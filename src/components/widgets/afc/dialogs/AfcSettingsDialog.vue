<template>
  <app-dialog
    v-model="open"
    width="700"
    card-class="afc-settings-dialog"
    :title="$t('app.afc.AfcSettings')"
    icon="$afcIcon"
    :help-icon="mdiLifebuoy"
    :help-text="$t('app.afc.SettingsDialog.Help')"
    :help-href="helpLink"
    scrollable
    no-actions
  >
    <v-card-text class="d-flex flex-column gap-3">
      <afc-settings-dialog-hub
        v-for="hub in afcHubs"
        :key="hub"
        :name="hub"
      />
      <afc-settings-dialog-extruder
        v-for="extruder in afcExtruders"
        :key="extruder"
        :name="extruder"
      />
      <afc-settings-dialog-lane
        v-for="lane in afcLanes"
        :key="lane"
        :name="lane"
      />
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { mdiCloseThick, mdiLifebuoy } from '@mdi/js'
import AfcMixin from '@/mixins/afc'
import AfcSettingsDialogHub from './AfcSettingsDialogHub.vue'
import AfcSettingsDialogExtruder from './AfcSettingsDialogExtruder.vue'
import AfcSettingsDialogLane from './AfcSettingsDialogLane.vue'

@Component({
  components: {
    AfcSettingsDialogHub,
    AfcSettingsDialogExtruder,
    AfcSettingsDialogLane
  }
})
export default class AfcSettingsDialog extends Mixins(StateMixin, AfcMixin) {
  mdiCloseThick = mdiCloseThick
  mdiLifebuoy = mdiLifebuoy
  helpLink = 'https://www.armoredturtle.xyz/docs/afc-klipper-add-on/toolhead/calculation.html'

  @VModel({ type: Boolean }) open?: boolean

  closeDialog () {
    this.$emit('close')
  }
}
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}

.height500 {
  max-height: 500px;
}
</style>
