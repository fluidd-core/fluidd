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
      <v-list-item
        v-if="hasEncoder"
        @click="showClogDetection = !showClogDetection"
      >
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="showClogDetection" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.mmu.setting.show_clog_detection') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="showTtgMap = !showTtgMap">
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="showTtgMap" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.mmu.setting.show_ttg_map') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="showDetails = !showDetails">
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="showDetails" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.mmu.setting.show_details') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="largeFilamentStatus = !largeFilamentStatus">
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="largeFilamentStatus" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.mmu.setting.large_filament_status') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item @click="showLogos = !showLogos">
        <v-list-item-action class="my-0">
          <v-checkbox :input-value="showLogos" />
        </v-list-item-action>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.mmu.setting.show_logos') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import MmuMixin from '@/mixins/mmu'

@Component({})
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
}
</script>
