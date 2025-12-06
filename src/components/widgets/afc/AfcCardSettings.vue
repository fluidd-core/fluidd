<template>
  <v-menu
    :offset-y="true"
    :close-on-content-click="false"
    :title="$t('app.afc.Settings')"
    left
  >
    <template #activator="{ on, attrs }">
      <app-btn
        icon
        v-bind="attrs"
        v-on="on"
      >
        <v-icon dense>
          $cog
        </v-icon>
      </app-btn>
    </template>
    <v-list>
      <v-list-item class="minHeight36">
        <v-checkbox
          v-model="showFilamentName"
          class="mt-0"
          hide-details
          :label="$t('app.afc.ShowFilamentName')"
        />
      </v-list-item>
      <v-list-item class="minHeight36">
        <v-checkbox
          v-model="showLaneInfinite"
          class="mt-0"
          hide-details
          :label="$t('app.afc.ShowLaneInfinite')"
        />
      </v-list-item>
      <v-list-item class="minHeight36">
        <v-checkbox
          v-model="showUnitIcons"
          class="mt-0"
          hide-details
          :label="$t('app.afc.ShowUnitIcons')"
        />
      </v-list-item>
      <v-list-item
        v-if="td1Present"
        class="minHeight36"
      >
        <v-checkbox
          v-model="showTd1Color"
          class="mt-0"
          hide-details
          :label="$t('app.afc.ShowTd1Color')"
        />
      </v-list-item>
      <v-divider />
      <afc-card-settings-extruder
        v-for="extruder in afcExtruders"
        :key="extruder"
        :name="extruder"
      />
      <afc-card-settings-unit
        v-for="unit in afcUnits"
        :key="unit"
        :name="unit"
      />
    </v-list>
  </v-menu>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import AfcCardSettingsExtruder from '@/components/widgets/afc/AfcCardSettingsExtruder.vue'
import AfcCardSettingsUnit from '@/components/widgets/afc/AfcCardSettingsUnit.vue'

@Component({
  components: {
    AfcCardSettingsExtruder,
    AfcCardSettingsUnit
  }
})
export default class AfcCardSettings extends Mixins(StateMixin, AfcMixin) {
  get showFilamentName (): boolean {
    return this.afcShowFilamentName
  }

  set showFilamentName (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.showFilamentName',
      value,
      server: true
    })
  }

  get showLaneInfinite (): boolean {
    return this.afcShowLaneInfinite
  }

  set showLaneInfinite (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.showLaneInfinite',
      value,
      server: true
    })
  }

  get showUnitIcons (): boolean {
    return this.afcShowUnitIcons
  }

  set showUnitIcons (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.showUnitIcons',
      value,
      server: true
    })
  }

  get td1Present (): boolean {
    return this.afc?.td1_present === true
  }

  get showTd1Color (): boolean {
    return this.afcShowTd1Color
  }

  set showTd1Color (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.afc.showTd1Color',
      value,
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
