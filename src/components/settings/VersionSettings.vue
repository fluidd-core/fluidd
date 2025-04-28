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
          :disabled="!hasUpdates || hasInvalidComponent || isRefreshing || printerPrinting"
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
          :disabled="isRefreshing || printerPrinting"
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
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <template v-for="(component, i) in components">
        <app-setting :key="`component-${component.name}-${i}`">
          <template #title>
            {{ packageTitle(component) }}
            <v-tooltip
              v-if="'remote_url' in component && component.remote_url !== '?'"
              bottom
            >
              <template #activator="{ attrs, on }">
                <a
                  v-bind="attrs"
                  :href="component.remote_url"
                  target="_blank"
                  v-on="on"
                >
                  <v-icon
                    small
                    right
                  >
                    $openInNew
                  </v-icon>
                </a>
              </template>
              <span>{{ component.remote_url }}</span>
            </v-tooltip>
          </template>

          <template #sub-title>
            <span v-if="'full_version_string' in component">
              {{ component.full_version_string }}
            </span>
            <span v-else-if="'version' in component">
              {{ component.version }}
            </span>

            <span v-if="'remote_version' in component && hasUpdate(component.name)">
              -> {{ component.remote_version }}
            </span>
            <span v-if="'package_count' in component && component.package_count > 0">
              {{ component.package_count }} packages
            </span>
          </template>

          <v-tooltip
            v-if="hasUpdate(component.name) && !inError(component)"
            left
          >
            <template #activator="{ attrs, on }">
              <app-btn
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
            <span v-if="'name' in component && component.name !== 'system'">{{ $t('app.version.tooltip.release_notes') }}</span>
            <span v-else-if="'commits_behind' in component">{{ $t('app.version.tooltip.commit_history') }}</span>
            <span v-else-if="'package_list' in component">{{ $t('app.version.tooltip.packages') }}</span>
          </v-tooltip>

          <version-status
            :has-update="hasUpdate(component.name)"
            :disabled="isRefreshing || printerPrinting"
            :loading="isRefreshing"
            :dirty="('is_dirty' in component) ? component.is_dirty : false"
            :valid="('is_valid' in component) ? component.is_valid : true"
            @on-update="handleUpdateComponent(component.name)"
            @on-recover="handleRecoverComponent(component)"
          />
        </app-setting>

        <template v-if="'warnings' in component">
          <v-alert
            v-for="(warning, index) in component.warnings ?? []"
            :key="`warning-${component.name}-${index}`"
            dense
            type="warning"
            text
            class="mx-4"
          >
            {{ warning }}
          </v-alert>
        </template>

        <template v-if="'anomalies' in component">
          <v-alert
            v-for="(anomaly, index) in component.anomalies ?? []"
            :key="`anomaly-${component.name}-${index}`"
            dense
            icon="$info"
            text
            class="mx-4"
          >
            {{ anomaly }}
          </v-alert>
        </template>

        <v-divider
          v-if="i < components.length - 1 && components.length > 0"
          :key="`component-${component.name}-${i}-_divider`"
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
import type { VersionInfo } from '@/store/version/types'

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

  get components (): VersionInfo[] {
    return this.$typedGetters['version/getVisibleComponents']
  }

  get isRefreshing () {
    return this.hasWait(this.$waits.onVersionRefresh)
  }

  get hasUpdates () {
    const d = this.$typedGetters['version/hasUpdates']
    return d
  }

  get hasInvalidComponent () {
    return this.components
      .some(component => 'is_valid' in component && !component.is_valid)
  }

  get enableNotifications (): boolean {
    return this.$typedState.config.uiSettings.general.enableVersionNotifications
  }

  set enableNotifications (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.enableVersionNotifications',
      value,
      server: true
    })
  }

  packageTitle (component: VersionInfo) {
    if (component.name === 'system') {
      return this.$t('app.version.label.os_packages')
    }

    return component.name
  }

  hasUpdate (component: string) {
    return this.$typedGetters['version/hasUpdate'](component)
  }

  inError (component: VersionInfo) {
    return (
      (
        'is_dirty' in component &&
        component.is_dirty
      ) ||
      (
        'is_valid' in component &&
        !component.is_valid
      )
    )
  }

  // Will attempt to update the requirec component based on its type.
  handleUpdateComponent (key: string) {
    this.$typedDispatch('version/onUpdateStatus', { busy: true })

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
  }

  // Will attempt to recover a component based on its type and current status.
  handleRecoverComponent (component: VersionInfo) {
    this.$typedDispatch('version/onUpdateStatus', { busy: true })

    if (
      'is_dirty' in component &&
      component.is_dirty
    ) {
      SocketActions.machineUpdateRecover(component.name, false)
    } else if (
      'is_valid' in component &&
      !component.is_valid
    ) {
      SocketActions.machineUpdateRecover(component.name, true)
    }
  }

  forceCheck () {
    if (this.$typedGetters['server/getIsMinApiVersion']('1.2.0')) {
      SocketActions.machineUpdateRefresh()
    } else {
      SocketActions.machineUpdateStatus(true)
    }
  }

  getBaseUrl (component: VersionInfo) {
    if ('remote_url' in component && component.remote_url) {
      return component.remote_url
    }
    if ('owner' in component) {
      return `https://github.com/${component.owner}/${component.repo_name || component.name}`
    }
    return ''
  }

  handleInformationDialog (component: VersionInfo) {
    switch (component.configured_type) {
      case 'python':
        if (component.channel === 'dev') {
          window.open(`${this.getBaseUrl(component)}/compare/${component.current_hash}..${component.remote_hash}`)
        } else {
          window.open(component.changelog_url)
        }
        break

      case 'git_repo':
      case 'system':
        this.informationDialogState = {
          open: true,
          component
        }
        break

      default:
        window.open(`${this.getBaseUrl(component)}/releases`)
        break
    }
  }
}
</script>
