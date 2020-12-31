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
          <div class="component-title">{{ packageTitle(component) }}</div>
          <v-layout align-center justify-space-between>
            <div class="component-version">
              {{ ('package_count' in component) ? component.package_count + ' packages' : component.version }}
              <span v-if="'remote_version' in component && hasUpdate(component.type)">
                to {{ component.remote_version }}
              </span>
            </div>

            <version-status
              :has-update="hasUpdate(component.type)"
              :disabled="hasWait(waits.onUpdate) || printerPrinting"
              :loading="hasWait(waits.onUpdate)"
              :dirty="('is_dirty' in component) ? component.is_dirty : false"
              :valid="('is_valid' in component) ? component.is_valid : true"
              @on-update="updateComponent(component.type)">
            </version-status>

          </v-layout>
        </v-list-item-content>

      </v-list-item>
    </template>

    <!-- <v-list-item class="v-list-item--x-dense">
      <v-list-item-content>
        <v-btn text outlined x-small :disabled="printerPrinting" @click="updateComponent('system')">update os packages</v-btn>
      </v-list-item-content>
    </v-list-item> -->

    <v-list-item @click="forceCheck()">
      <v-list-item-title>Check for updates</v-list-item-title>
      <v-list-item-icon>
        <v-icon :class="{ 'spin-alt': hasWait(waits.onForceUpdateCheck) }">$refresh</v-icon>
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

  hasUpdate (component: 'klipper' | 'moonraker' | 'client' | 'system') {
    return this.$store.getters['version/hasUpdate'](component)
  }

  packageTitle (component: HashVersion | OSPackage | ArtifactVersion) {
    if (component.type === 'client') {
      component = component as ArtifactVersion
      return component.name
    }

    if (component.type === 'system') {
      return 'os packages'
    }

    return component.type
  }

  updateComponent (component: 'klipper' | 'moonraker' | 'client' | 'system') {
    this.$store.dispatch('version/onUpdateStatus', { busy: true })
    switch (component) {
      case 'klipper':
        SocketActions.machineUpdateKlipper()
        break
      case 'moonraker':
        SocketActions.machineUpdateMoonraker()
        break
      case 'client':
        SocketActions.machineUpdateClient()
        break
      case 'system':
        SocketActions.machineUpdateSystem()
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
    color: #fff;
    font-weight: 500;
    font-size: 0.8125rem;
    line-height: 1rem;
  }
  .component-version {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8125rem;
    line-height: 1rem;
  }
</style>
