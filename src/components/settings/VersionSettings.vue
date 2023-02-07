<template>
  <div>
    <v-subheader id="versions">
      {{ $t('app.version.title') }}
      <!-- <v-icon small color="info" class="ml-2" v-if="hasUpdates">$warning</v-icon> -->
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting>
        <app-btn
          outlined
          small
          color="primary"
          class="mr-2"
          :disabled="!hasUpdates || isRefreshing || printerPrinting"
          @click="handleUpdateComponent('all')"
        >
          <v-icon left>
            $download
          </v-icon>
          {{ $t('app.version.btn.update_all') }}
        </app-btn>

        <app-btn
          outlined
          small
          color="primary"
          :disabled="isRefreshing"
          @click="forceCheck()"
        >
          <v-icon
            left
            :class="{ 'spin-alt': isRefreshing }"
          >
            $refresh
          </v-icon>
          {{ $t('app.version.btn.check_for_updates') }}
        </app-btn>
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.enable_notifications')"
      >
        <v-switch
          v-model="enableNotifications"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <template v-for="(component, i) in components">
        <app-setting
          :key="`component-${component.key}-${component.name}`"
          :title="packageTitle(component)"
        >
          <template #sub-title>
            <span v-if="component.key !== 'system' && 'full_version_string' in component">
              {{ component.full_version_string }}
            </span>
            <span v-else>
              {{ component.version }}
            </span>

            <span v-if="'remote_version' in component && hasUpdate(component.key)">
              -> {{ component.remote_version }}
            </span>
            <span v-if="component.key === 'system' && component.package_count > 0">
              {{ component.package_count }} packages
            </span>
          </template>

          <v-tooltip
            v-if="hasUpdate(component.key) && !inError(component)"
            left
          >
            <template #activator="{ attrs, on }">
              <app-btn
                v-if="hasUpdate(component.key) && !inError(component)"
                v-bind="attrs"
                color="primary"
                icon
                small
                @click="handleInformationDialog(component)"
                v-on="on"
              >
                <v-icon small>
                  $info
                </v-icon>
              </app-btn>
            </template>
            <span v-if="'name' in component">{{ $t('app.version.tooltip.release_notes') }}</span>
            <span v-if="'commits_behind' in component">{{ $t('app.version.tooltip.commit_history') }}</span>
            <span v-if="'package_list' in component">{{ $t('app.version.tooltip.packages') }}</span>
          </v-tooltip>

          <version-status
            :has-update="hasUpdate(component.key)"
            :disabled="isRefreshing || printerPrinting"
            :loading="isRefreshing"
            :dirty="('is_dirty' in component) ? component.is_dirty : false"
            :valid="('is_valid' in component) ? component.is_valid : true"
            @on-update="handleUpdateComponent(component.key)"
            @on-recover="handleRecoverComponent(component)"
          />
        </app-setting>

        <v-divider
          v-if="i < components.length - 1 && components.length > 0"
          :key="`component-${component.key}-${component.name}-_divider`"
        />
      </template>
    </v-card>

    <version-commit-history-dialog
      v-if="informationDialogState.open"
      v-model="informationDialogState.open"
      :component="informationDialogState.component"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import VersionStatus from './VersionStatus.vue'
import VersionCommitHistoryDialog from './VersionInformationDialog.vue'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
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
    return this.hasWait(this.$waits.onVersionRefresh)
  }

  get hasUpdates () {
    const d = this.$store.getters['version/hasUpdates']
    return d
  }

  get enableNotifications () {
    return this.$store.state.config.uiSettings.general.enableVersionNotifications
  }

  set enableNotifications (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.enableVersionNotifications',
      value,
      server: true
    })
  }

  packageTitle (component: HashVersion | OSPackage | ArtifactVersion) {
    if (component.key === 'system') {
      return this.$t('app.version.label.os_packages')
    }

    return component.key
  }

  hasUpdate (component: string) {
    return this.$store.getters['version/hasUpdate'](component)
  }

  inError (component: HashVersion | OSPackage | ArtifactVersion) {
    const dirty = ('is_dirty' in component) ? component.is_dirty : false
    const valid = ('is_valid' in component) ? component.is_valid : true
    return (dirty || !valid)
  }

  packageUrl (component: HashVersion | OSPackage | ArtifactVersion) {
    if (component.key === 'klipper') return 'https://github.com/Klipper3d/klipper/commits/master'
    if (component.key === 'moonraker') return 'https://github.com/Arksine/moonraker/commits/master'
    if (component.key === 'fluidd' && 'name' in component && component.name === 'fluidd') return 'https://github.com/fluidd-core/fluidd/releases'
  }

  // Will attempt to update the requirec component based on its type.
  handleUpdateComponent (key: string) {
    this.$store.dispatch('version/onUpdateStatus', { busy: true })
    switch (key) {
      case 'klipper':
        SocketActions.machineUpdateKlipper()
        break
      case 'moonraker':
        SocketActions.machineUpdateMoonraker()
        break
      case 'system':
        SocketActions.machineUpdateSystem()
        break
      case 'all':
        SocketActions.machineUpdateAll()
        break
      default: // assume a client update
        SocketActions.machineUpdateClient(key)
        break
    }
    // Close the drawer
    this.$emit('click')
  }

  // Will attempt to recover a component based on its type and current status.
  handleRecoverComponent (component: HashVersion | OSPackage | ArtifactVersion) {
    this.$store.dispatch('version/onUpdateStatus', { busy: true })
    const dirty = ('is_dirty' in component) ? component.is_dirty : false
    const valid = ('is_valid' in component) ? component.is_valid : true
    if (dirty) {
      SocketActions.machineUpdateRecover(component.key, false)
    }
    if (!valid) {
      SocketActions.machineUpdateRecover(component.key, true)
    }
  }

  forceCheck () {
    if (this.$store.getters['server/getIsMinApiVersion'](1, 2)) {
      SocketActions.machineUpdateRefresh()
    } else {
      SocketActions.machineUpdateStatus(true)
    }
  }

  getBaseUrl (component: HashVersion | ArtifactVersion) {
    if ('owner' in component) {
      return `https://github.com/${component.owner}/${component.key}`
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
