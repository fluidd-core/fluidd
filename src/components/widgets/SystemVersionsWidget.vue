<template>
  <v-list-group
    :value="hasUpdates"
    prepend-icon="$update"
    no-action>
    <template v-slot:activator>
      <v-list-item-content>
        <v-list-item-title>
          Software Updates
        </v-list-item-title>
      </v-list-item-content>
    </template>

    <template v-for="(component) in versionComponents">
      <v-list-item
        :key="component.key"
        class="v-list-item--x-dense"
      >
        <v-list-item-content>
          <a v-if="component.type !== 'system'" class="component-title" :href="packageUrl(component)" target="_blank" v-html="packageTitle(component)"></a>
          <div v-else class="component-title" v-html="packageTitle(component)"></div>
          <v-layout align-center justify-space-between>
            <div class="component-version">
              {{ ('package_count' in component) ? component.package_count + ' packages' : component.version }}
              <span v-if="'remote_version' in component && hasUpdate(component.type)">
                to {{ component.remote_version }}
              </span>
            </div>

            <version-status
              :has-update="hasUpdate(component.type)"
              :disabled="isRefreshing || printerPrinting"
              :loading="isRefreshing"
              :dirty="('is_dirty' in component) ? component.is_dirty : false"
              :valid="('is_valid' in component) ? component.is_valid : true"
              @on-update="updateComponent(component.type)">
            </version-status>

          </v-layout>
        </v-list-item-content>

      </v-list-item>
    </template>

    <v-list-item @click="forceCheck()" :disabled="printerPrinting">
      <v-list-item-title>Check for updates</v-list-item-title>
      <v-list-item-icon>
        <v-icon :class="{ 'spin-alt': isRefreshing }">$refresh</v-icon>
      </v-list-item-icon>
    </v-list-item>

  </v-list-group>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { SocketActions } from '@/socketActions'
import VersionStatus from '@/components/VersionStatus.vue'
import UtilsMixin from '@/mixins/utils'
import { Waits } from '@/globals'
import { ArtifactVersion, HashVersion, OSPackage } from '@/store/version/types'

@Component({
  components: {
    VersionStatus
  }
})
export default class SystemVersionsWidget extends Mixins(UtilsMixin) {
  waits = Waits

  get instanceName () {
    return this.$store.state.config.fileConfig.general.instanceName
  }

  get versionComponents () {
    return this.$store.getters['version/getVisibleComponents']
  }

  get hasUpdates () {
    return this.$store.getters['version/hasUpdates']
  }

  get skipClientUpdates () {
    return this.$store.state.version.skipClientUpdates
  }

  get isRefreshing () {
    return this.$store.state.version.refreshing
  }

  hasUpdate (component: string) {
    return this.$store.getters['version/hasUpdate'](component)
  }

  packageTitle (component: HashVersion | OSPackage | ArtifactVersion) {
    if (component.type === 'system') {
      return 'os packages'
    }

    return component.type
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

<style lang="scss" scoped>
  .component-title {
    font-weight: 500;
    font-size: 0.8125rem;
    line-height: 1rem;
  }
  .component-version {
    opacity: 0.7;
    font-size: 0.8125rem;
    line-height: 1rem;
  }
</style>
