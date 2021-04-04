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
            <span v-if="component.type === 'system' && component.package_count > 0">
              {{ component.package_count }} packages
            </span>
          </template>

          <v-tooltip left>
            <template v-slot:activator="{ attrs, on }">
              <app-btn
                v-if="hasUpdate(component.type)"
                @click="handleInformationDialog(component)"
                v-on="on"
                v-bind="attrs"
                color="primary"
                icon
                small
              >
                <v-icon small>$info</v-icon>
              </app-btn>
            </template>
            <span v-if="'name' in component">release notes</span>
            <span v-if="'commits_behind' in component">commits</span>
            <span v-if="'package_list' in component">packages</span>
          </v-tooltip>

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

    <version-commit-history-dialog
      v-model="informationDialogState.open"
      :component="informationDialogState.component"
    >
    </version-commit-history-dialog>

  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import VersionStatus from './VersionStatus.vue'
import VersionCommitHistoryDialog from './VersionInformationDialog.vue'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/socketActions'
import { ArtifactVersion, HashVersion, OSPackage } from '@/store/version/types'

@Component({
  components: {
    VersionStatus,
    VersionCommitHistoryDialog
  }
})
export default class VersionSettings extends Mixins(StateMixin) {
  informationDialogState: any = {
    open: false,
    component: null
  }

  get components () {
    return this.$store.getters['version/getVisibleComponents']
  }

  get isRefreshing () {
    return this.$store.state.version.refreshing
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

  hasUpdate (component: string) {
    return this.$store.getters['version/hasUpdate'](component)
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

  getBaseUrl (component: HashVersion | ArtifactVersion) {
    if ('owner' in component) {
      return `https://github.com/${component.owner}/${component.type}`
    }
    return ''
  }

  handleInformationDialog (component: HashVersion | OSPackage | ArtifactVersion) {
    if (
      'commits_behind' in component ||
      'package_list' in component
    ) {
      this.informationDialogState = {
        open: true,
        component
      }
    } else {
      window.open(`${this.getBaseUrl(component)}/releases`)
    }
  }
}
</script>
