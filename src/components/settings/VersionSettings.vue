<template>
  <div>
    <v-subheader id="versions">{{ $t('app.version.title') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">

      <app-setting>
        <app-btn
          outlined
          small
          color="primary"
          @click="forceCheck()"
          :disabled="isRefreshing"
        >
          <v-icon left :class="{ 'spin-alt': isRefreshing }">$refresh</v-icon>
          {{ $t('app.version.btn.check_for_updates') }}
        </app-btn>
      </app-setting>

      <v-divider></v-divider>

      <template v-for="(component, i) in components">
        <app-setting
          :key="`component-${component.type}-${component.name}`"
          :title="packageTitle(component)"
        >
          <template v-slot:sub-title>
            <span v-if="component.type !== 'system'">{{ component.version }}</span>
            <span v-if="'remote_version' in component && hasUpdate(component.type)">
              -> {{ component.remote_version }}
            </span>
            <v-tooltip
                v-if="component.type === 'system' && component.package_count > 0"
                max-width="300"
                top
            >
              <template v-slot:activator="{ on, attrs }">
                <span v-bind="attrs" v-on="on">
                  {{ component.package_count }} packages
                </span>
              </template>
              <span>{{ (component.package_list) ? component.package_list.join(', ') : '' }}</span>
            </v-tooltip>
          </template>

          <version-status
            :has-update="hasUpdate(component.type)"
            :disabled="isRefreshing || printerPrinting"
            :loading="isRefreshing"
            :dirty="('is_dirty' in component) ? component.is_dirty : false"
            :valid="('is_valid' in component) ? component.is_valid : true"
            @on-update="updateComponent(component.type)">
          </version-status>

        </app-setting>

        <v-divider :key="`component-${component.type}-${component.name}-_divider`" v-if="i < components.length - 1 && components.length > 0"></v-divider>
      </template>

    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import VersionStatus from './VersionStatus.vue'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/socketActions'
import { ArtifactVersion, HashVersion, OSPackage } from '@/store/version/types'

@Component({
  components: {
    VersionStatus
  }
})
export default class VersionSettings extends Mixins(StateMixin) {
  get components () {
    return this.$store.getters['version/getVisibleComponents']
  }

  packageTitle (component: HashVersion | OSPackage | ArtifactVersion) {
    if (component.type === 'system') {
      return 'os packages'
    }

    return component.type
  }

  get isRefreshing () {
    return this.$store.state.version.refreshing
  }

  hasUpdate (component: string) {
    return this.$store.getters['version/hasUpdate'](component)
  }

  get hasUpdates () {
    return this.$store.getters['version/hasUpdates']
  }

  packageUrl (component: HashVersion | OSPackage | ArtifactVersion) {
    if (component.type === 'klipper') return 'https://github.com/KevinOConnor/klipper/commits/master'
    if (component.type === 'moonraker') return 'https://github.com/Arksine/moonraker/commits/master'
    if (component.type === 'fluidd' && 'name' in component && component.name === 'fluidd') return 'https://github.com/cadriel/fluidd/releases'
  }

  updateComponent (type: string) {
    this.$store.dispatch('version/onUpdateStatus', { busy: true })
    switch (type) {
      case 'klipper':
        SocketActions.machineUpdateKlipper()
        break
      case 'moonraker':
        SocketActions.machineUpdateMoonraker()
        break
      case 'system':
        SocketActions.machineUpdateSystem()
        break
      default: // assume a client update
        SocketActions.machineUpdateClient(type)
        break
    }
    // Close the drawer
    this.$emit('click')
  }

  forceCheck () {
    SocketActions.machineUpdateStatus(true)
  }
}
</script>
