<template>
  <div>
    <v-subheader id="mmu">
      {{ $t('app.mmu.title.headline') }}
    </v-subheader>

    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting
        v-if="hasEncoder"
        :title="$t('app.mmu.setting.show_clog_detection')"
      >
        <v-switch
          v-model="showClogDetection"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.mmu.setting.show_ttg_map')">
        <v-switch
          v-model="showTtgMap"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.mmu.setting.show_details')">
        <v-switch
          v-model="showDetails"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.mmu.setting.large_filament_status')">
        <v-switch
          v-model="largeFilamentStatus"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.mmu.setting.show_unavailable_spool_color')">
        <v-switch
          v-model="showUnavailableSpoolColor"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.mmu.setting.show_logos')">
        <v-switch
          v-model="showLogos"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.reset')">
        <app-btn
          outlined
          small
          color="primary"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'
import { defaultState } from '@/store/config/state'

@Component({
  components: {}
})
export default class MmuSettings extends Mixins(StateMixin, MmuMixin) {
  get showClogDetection (): boolean {
    return this.$typedState.config.uiSettings.mmu.showClogDetection
  }

  set showClogDetection (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.mmu.showClogDetection',
      value,
      server: true
    })
  }

  get showTtgMap (): boolean {
    return this.$typedState.config.uiSettings.mmu.showTtgMap
  }

  set showTtgMap (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.mmu.showTtgMap',
      value,
      server: true
    })
  }

  get showDetails (): boolean {
    return this.$typedState.config.uiSettings.mmu.showDetails
  }

  set showDetails (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.mmu.showDetails',
      value,
      server: true
    })
  }

  get largeFilamentStatus (): boolean {
    return this.$typedState.config.uiSettings.mmu.largeFilamentStatus
  }

  set largeFilamentStatus (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.mmu.largeFilamentStatus',
      value,
      server: true
    })
  }

  get showUnavailableSpoolColor (): boolean {
    return this.$typedState.config.uiSettings.mmu.showUnavailableSpoolColor
  }

  set showUnavailableSpoolColor (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.mmu.showUnavailableSpoolColor',
      value,
      server: true
    })
  }

  get showLogos (): boolean {
    return this.$typedState.config.uiSettings.mmu.showLogos
  }

  set showLogos (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.mmu.showLogos',
      value,
      server: true
    })
  }

  handleReset () {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.mmu',
      value: defaultState().uiSettings.mmu,
      server: true
    })
  }
}
</script>
