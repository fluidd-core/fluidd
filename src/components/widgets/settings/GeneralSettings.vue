<template>
  <div>
    <v-subheader id="general">{{ $t('General') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <v-list
        color="transparent"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Printer name') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              filled
              dense
              single-line
              hide-details="auto"
              ref="instanceName"
              :rules="instanceNameRules"
              :value="instanceName"
              :default-value="$globals.APP_NAME"
              @change="setInstanceName"
            ></v-text-field>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>{{ $t('Display Language') }}</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-select
              filled
              dense
              single-line
              hide-details="auto"
              v-model="$i18n.locale"
              :items="languageList"
              :value="locale"
              @change="setLocale"
            ></v-select>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              <span class="text-wrap">{{ $t('Time estimates') }}</span>
              <inline-help bottom small class="ml-2">
                <span>{{ $t('Duration only') }}</span><br />
                <span>{{ $t('Similar to a klipper LCD, this only shows duration with no estimates.') }}</span><br /><br />

                <span>{{ $t('Slicer') }}</span><br />
                <span>{{ $t('Uses the slicer estimates for display. You must enable this in your slicer.') }}</span><br /><br />

                <span>{{ $t('File') }}</span><br />
                <span v-html="$t('Takes progress percent, and duration to estimate total duration.<br />More accurate over time.')"></span><br /><br />

                <span>{{ $t('Filament') }}</span><br />
                <span v-html="$t('Takes used filament vs estimated filament to estimate total duration.<br />More accurate over time.')"></span>
              </inline-help>
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-select
              filled
              dense
              hide-details="auto"
              :items="estimateTypes"
              item-text="name"
              item-value="value"
              v-model="printTimeEstimateType">
            </v-select>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class GeneralSettingsCard extends Mixins(StateMixin) {
  @Ref('instanceName') readonly instanceNameElement!: any

  instanceNameRules = [
    (v: string) => !!v || 'Required'
  ]

  get estimateTypes () {
    return [
      { name: this.$t('Duration only'), value: 'totals' },
      { name: this.$t('Slicer'), value: 'slicer' },
      { name: this.$t('File Estimation'), value: 'file' },
      { name: this.$t('Filament Estimation'), value: 'filament' }
    ]
  }

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  setInstanceName (value: string) {
    if (this.instanceNameElement.valid) this.$store.dispatch('config/updateInstance', value)
  }

  get locale () {
    return this.$store.state.config.uiSettings.general.locale
  }

  setLocale (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.locale',
      value,
      server: true
    })
  }

  get languageList () {
    return Object.keys(this.$i18n.messages)
  }

  get printTimeEstimateType () {
    return this.$store.state.config.uiSettings.general.printTimeEstimationsType
  }

  set printTimeEstimateType (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.printTimeEstimationsType',
      value,
      server: true
    })
  }
}
</script>
