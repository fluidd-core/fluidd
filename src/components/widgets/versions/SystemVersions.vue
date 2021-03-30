<template>
  <collapsable-card
    :title="$t('app.version.title')"
    :collapsable="false"
    icon="$update">

    <template v-slot:title>
      <v-icon left color="warning" v-if="hasUpdates">$info</v-icon>
      <v-icon left v-else>$update</v-icon>
      <span class="font-weight-light">{{ $t('app.version.title') }}</span>
    </template>

    <template v-slot:collapse-button>
      <app-btn
        @click="forceCheck()"
        color=""
        fab small text>
        <v-icon :class="{ 'spin-alt': isRefreshing }">$refresh</v-icon>
      </app-btn>
    </template>

    <v-list
      two-line
    >
      <template v-for="(component, i) in versionComponents">
        <v-list-item
          :key="`component-${component.type}-${component.name}`"
          class="v-list-item--x-dense"
        >
          <v-list-item-content>

            <!-- <a v-if="component.type !== 'system'" class="component-title" :href="packageUrl(component)" target="_blank" v-html="packageTitle(component)"></a> -->
            <v-list-item-title>
              {{ packageTitle(component) }}
              {{ component.key }}
            </v-list-item-title>

            <v-list-item-subtitle>
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
            </v-list-item-subtitle>
          </v-list-item-content>

          <v-list-item-action>
            <version-status
              :has-update="hasUpdate(component.type)"
              :disabled="isRefreshing || printerPrinting"
              :loading="isRefreshing"
              :dirty="('is_dirty' in component) ? component.is_dirty : false"
              :valid="('is_valid' in component) ? component.is_valid : true"
              @on-update="updateComponent(component.type)">
            </version-status>
          </v-list-item-action>
        </v-list-item>

        <v-divider
          v-if="i < versionComponents.length - 1"
          :key="`divider-${component.type}-${component.name}`"
        />
      </template>

    </v-list>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { SocketActions } from '@/socketActions'
import VersionStatus from '@/components/widgets/versions/VersionStatus.vue'
import StateMixin from '@/mixins/state'
import { Waits } from '@/globals'
import { ArtifactVersion, HashVersion, OSPackage } from '@/store/version/types'

@Component({
  components: {
    VersionStatus
  }
})
export default class SystemVersions extends Mixins(StateMixin) {
  waits = Waits

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  get versionComponents () {
    return this.$store.getters['version/getVisibleComponents']
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
