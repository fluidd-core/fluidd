<template>
  <v-menu
    bottom
    left
    offset-y
    transition="slide-y-transition"
    :close-on-content-click="false"
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

    <v-list dense>
      <v-list-item @click="showFilamentName = !showFilamentName">
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="showFilamentName" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.afc.ShowFilamentName') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="showLaneInfinite = !showLaneInfinite">
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="showLaneInfinite" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.afc.ShowLaneInfinite') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="showUnitIcons = !showUnitIcons">
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="showUnitIcons" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.afc.ShowUnitIcons') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item
        v-if="td1Present"
        @click="showTd1Color = !showTd1Color"
      >
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="showTd1Color" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.afc.ShowTd1Color') }}
          </v-list-item-title>
        </v-list-item-content>
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
