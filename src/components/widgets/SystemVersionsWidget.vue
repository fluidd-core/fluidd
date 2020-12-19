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

    <template v-for="(component, i) in versionComponents">
      <v-list-item
        :key="i"
        v-if="!(i === 'client' && skipClientUpdates) && klippyConnected"
        class="v-list-item--x-dense"
      >
        <v-list-item-content>
          <v-list-item-title>{{ (component.name) ? component.name : i }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ component.version }}
            <span v-if="component.remote_version && hasUpdate(i)">
              <v-icon x-small>$chevronRight</v-icon> {{ component.remote_version }}
            </span>
          </v-list-item-subtitle>
        </v-list-item-content>

        <v-list-item-action>
          <v-list-item-action-text>
            <version-status
              :has-update="hasUpdate(i)"
              :disabled="hasWait(waits.onUpdate)"
              :loading="hasWait(waits.onUpdate)"
              :dirty="(component.name) ? false : component.is_dirty"
              :valid="(component.name) ? true : component.is_valid"
              @on-update="updateComponent(i)">
            </version-status>
          </v-list-item-action-text>
        </v-list-item-action>
      </v-list-item>
    </template>

    <v-list-item class="v-list-item--x-dense" v-if="klippyConnected">
      <v-list-item-content>
        <v-list-item-title>System</v-list-item-title>
      </v-list-item-content>

      <v-list-item-action>
        <v-list-item-action-text>
          <v-btn x-small text color="warning" @click="updateComponent('system')">UPDATE</v-btn>
        </v-list-item-action-text>
      </v-list-item-action>
    </v-list-item>

    <v-list-item @click="forceCheck()" v-if="klippyConnected">
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
    return this.$store.getters['version/getComponents']
  }

  get hasUpdates () {
    return this.$store.getters['version/hasUpdates']
  }

  get skipClientUpdates () {
    return this.$store.state.version.skipClientUpdates
  }

  hasUpdate (component: 'klipper' | 'moonraker' | 'client') {
    return this.$store.getters['version/hasUpdate'](component)
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
