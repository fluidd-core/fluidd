<template>
  <div>
    <v-subheader id="firmware">
      {{ $t('app.firmware.title') }}
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
          :disabled="!isSupported || updateDisabled || !hasUpdates"
          @click="updateAll"
        >
          <v-icon left>
            $download
          </v-icon>
          {{ $t('app.firmware.btn.update_all') }}
        </app-btn>

        <app-btn
          outlined
          small
          color="primary"
          :disabled="isRefreshing || busy"
          @click="handleRefresh"
        >
          <v-icon
            left
            :class="{ 'spin-alt': isRefreshing }"
          >
            $refresh
          </v-icon>
          {{ $t('app.firmware.btn.refresh') }}
        </app-btn>
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.firmware.label.enable_notifications')">
        <v-switch
          v-model="enableNotifications"
          hide-details
          @click.native.stop
        />
      </app-setting>

      <div
        v-if="!isSupported"
        class="pa-4"
      >
        <v-alert
          type="info"
          text
          class="mb-0"
        >
          {{ $t('app.firmware.label.not_running') }}
        </v-alert>
      </div>

      <template v-else>
        <template v-if="isLoading">
          <v-divider />
          <app-setting :title="$t('app.firmware.label.loading')">
            <v-progress-circular
              indeterminate
              size="20"
              width="2"
              color="primary"
            />
          </app-setting>
        </template>

        <v-alert
          v-if="statusError"
          type="error"
          text
          class="mx-4 mt-4"
        >
          {{ $t('app.firmware.label.status_error', { message: statusError }) }}
        </v-alert>

        <v-alert
          v-if="status && !isApiSupported"
          type="warning"
          text
          class="mx-4 mt-4"
        >
          {{ $t('app.firmware.label.unsupported_api', { version: status.api_version }) }}
        </v-alert>

        <v-alert
          v-if="blocker"
          type="warning"
          text
          class="mx-4 mt-4"
        >
          {{ blocker.message }}
          <div
            v-if="blocker.reason === 'restart_pending'"
            class="mt-2"
          >
            {{ $t('app.firmware.label.restart_pending_hint') }}
          </div>
        </v-alert>

        <v-alert
          v-if="lastResult && lastResult.outcome === 'failed' && lastMessage"
          type="error"
          text
          dismissible
          class="mx-4 mt-4"
          @input="dismissLastResult"
        >
          {{ lastMessage }}
        </v-alert>

        <template v-if="host">
          <v-divider />
          <app-setting
            :title="$t('app.firmware.label.host')"
            :sub-title="hostSubTitle"
          />
        </template>

        <template v-for="mcu in mcus">
          <v-divider :key="`mcu:divider:${mcu.name}`" />

          <app-setting
            :key="`mcu::${mcu.name}`"
            :title="mcu.name"
          >
            <template #sub-title>
              <span v-if="mcu.transport">{{ transportLabel(mcu.transport) }} · </span>
              <span>{{ mcu.running_version || $t('app.firmware.label.unknown_version') }}</span>
              <span v-if="mcu.state === 'update_available' && host && host.software_version">
                -> {{ host.software_version }}
              </span>
            </template>

            <firmware-status
              :state="mcu.state"
              :actions="mcu.actions"
              :message="mcu.message"
              :disabled="updateDisabled"
              @on-update="updateOne(mcu.name)"
            />
          </app-setting>
        </template>
      </template>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FirmwareStatus from './FirmwareStatus.vue'
import { Waits } from '@/globals'

@Component({
  components: {
    FirmwareStatus
  }
})
export default class FirmwareSettings extends Mixins(StateMixin) {
  get isSupported (): boolean {
    return this.$typedGetters['firmware/isSupported']
  }

  get isLoading (): boolean {
    return this.$typedGetters['firmware/isLoading']
  }

  get isApiSupported (): boolean {
    return this.$typedGetters['firmware/isApiSupported']
  }

  get isRefreshing (): boolean {
    return this.hasWait(Waits.onFirmwareRefresh)
  }

  get busy (): boolean {
    return this.$typedState.firmware.busy
  }

  get status (): Aldis.StatusResponse | null {
    return this.$typedState.firmware.status
  }

  get statusError (): string | null {
    return this.$typedGetters['firmware/getStatusError']
  }

  get host (): Aldis.Host | null {
    return this.$typedGetters['firmware/getHost']
  }

  get hostSubTitle (): string {
    const host = this.host

    if (!host) {
      return ''
    }

    return host.software_version
      ? `${host.software_version} · ${this.$t('app.firmware.label.host_hint')}`
      : `${host.klippy_state}: ${host.klippy_message}`
  }

  get blocker (): Aldis.Blocker | null {
    return this.$typedGetters['firmware/getBlocker']
  }

  get mcus (): Aldis.Mcu[] {
    return this.$typedGetters['firmware/getMcus']
  }

  get hasUpdates (): boolean {
    return this.$typedGetters['firmware/hasUpdates']
  }

  get lastResult (): Aldis.RunResult | null {
    return this.$typedState.firmware.lastResult
  }

  get lastMessage (): string | null {
    return this.$typedState.firmware.lastMessage
  }

  get updateDisabled (): boolean {
    return (
      this.isLoading ||
      this.blocker != null ||
      !this.isApiSupported ||
      this.isRefreshing ||
      this.busy ||
      this.printerBusy
    )
  }

  get enableNotifications (): boolean {
    return this.$typedState.config.uiSettings.general.enableFirmwareNotifications
  }

  set enableNotifications (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.enableFirmwareNotifications',
      value,
      server: true
    }).then(() => this.$typedDispatch('firmware/updateNotification'))
  }

  transportLabel (transport: Aldis.Transport): string {
    return transport.type === 'can'
      ? `${transport.interface} · ${transport.uuid}`
      : transport.device
  }

  refresh () {
    this.$typedDispatch('firmware/refresh')
  }

  handleRefresh () {
    if (this.isSupported) {
      this.refresh()
    } else {
      this.refreshAgents()
    }
  }

  refreshAgents () {
    this.$typedDispatch('server/refreshAgents')
  }

  updateOne (name: string) {
    this.$typedDispatch('firmware/update', { mcus: [name] })
  }

  updateAll () {
    const mcus: string[] = this.$typedGetters['firmware/getUpdatableMcus']

    if (mcus.length > 0) {
      this.$typedDispatch('firmware/update', { mcus })
    }
  }

  dismissLastResult () {
    this.$typedCommit('firmware/setClearLastResult')
  }
}
</script>
