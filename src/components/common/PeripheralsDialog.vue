<template>
  <app-dialog
    v-model="open"
    :title="$t('app.system_info.label.devices')"
    max-width="550"
    no-actions
  >
    <v-toolbar dense>
      <v-tabs
        v-model="tab"
        show-arrows
      >
        <v-tab
          v-for="peripheralGroup in peripheralGroups"
          :key="peripheralGroup.type"
        >
          <div>
            {{ $filters.prettyCase(peripheralGroup.type) }}
            <v-chip
              small
              link
              class="ml-2"
            >
              {{ peripheralGroup.count ?? '?' }}
            </v-chip>
          </div>
        </v-tab>
      </v-tabs>

      <v-spacer />

      <v-tooltip bottom>
        <template #activator="{ on, attrs }">
          <v-btn
            v-bind="attrs"
            fab
            text
            small
            :disabled="!currentPeripheralGroup || hasWaitFor(currentPeripheralGroup)"
            @click.prevent.stop="handleRefresh()"
            v-on="on"
          >
            <v-icon
              :class="{ 'spin-alt': currentPeripheralGroup && hasWaitFor(currentPeripheralGroup) }"
            >
              $refresh
            </v-icon>
          </v-btn>
        </template>
        <span>{{ $t('app.general.btn.refresh') }}</span>
      </v-tooltip>
    </v-toolbar>

    <v-card-text class="fill-height">
      <v-tabs-items
        v-model="tab"
        touchless
      >
        <v-tab-item
          v-for="peripheralGroup in peripheralGroups"
          :key="peripheralGroup.type"
        >
          <template v-if="peripheralGroup.count == null">
            {{ $t('app.system_info.msg.no_devices_searched') }}
          </template>

          <template v-else-if="peripheralGroup.count == 0">
            {{ $t('app.system_info.msg.no_devices_found') }}

            <v-alert
              v-if="peripheralGroup.type === 'can'"
              type="info"
              text
              class="mt-4 mb-0"
            >
              <span v-html="$t('app.system_info.msg.canbus_warning')" />
            </v-alert>
          </template>

          <template v-else-if="peripheralGroup.type === 'serial'">
            <v-row
              v-for="(device, index) in peripherals.serial_devices"
              :key="index"
            >
              <v-col>
                <v-card outlined>
                  <v-card-title>{{ device.device_name }}</v-card-title>
                  <v-card-subtitle>{{ $filters.prettyCase(device.device_type) }}</v-card-subtitle>

                  <v-card-text>
                    <v-row>
                      <v-col>
                        <app-text-field-with-copy
                          :value="device.device_path"
                          label="device_path"
                          outlined
                          persistent-placeholder
                          dense
                          readonly
                          hide-details
                        />
                      </v-col>
                    </v-row>

                    <v-row v-if="device.path_by_id">
                      <v-col>
                        <app-text-field-with-copy
                          :value="device.path_by_id"
                          label="path_by_id"
                          outlined
                          persistent-placeholder
                          dense
                          readonly
                          hide-details
                        />
                      </v-col>
                    </v-row>

                    <v-row v-if="device.path_by_hardware">
                      <v-col>
                        <app-text-field-with-copy
                          :value="device.path_by_hardware"
                          label="path_by_hardware"
                          outlined
                          persistent-placeholder
                          dense
                          readonly
                          hide-details
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>

                  <v-divider />

                  <v-simple-table dense>
                    <tbody>
                      <tr>
                        <th>driver_name</th>
                        <td>{{ device.driver_name }}</td>
                      </tr>
                      <tr v-if="device.usb_location">
                        <th>usb_location</th>
                        <td>{{ device.usb_location }}</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-card>
              </v-col>
            </v-row>
          </template>

          <template v-else-if="peripheralGroup.type === 'usb'">
            <v-row
              v-for="(device, index) in peripherals.usb_devices"
              :key="index"
            >
              <v-col>
                <v-card outlined>
                  <v-card-title>{{ device.product ?? $t("app.general.label.unknown") }} ({{ device.vendor_id }}:{{ device.product_id }})</v-card-title>
                  <v-card-subtitle>{{ device.description ?? $t("app.general.label.unknown") }}</v-card-subtitle>

                  <v-divider />

                  <v-simple-table dense>
                    <tbody>
                      <tr>
                        <th>usb_location</th>
                        <td>{{ device.usb_location }}</td>
                      </tr>
                      <tr v-if="device.manufacturer">
                        <th>manufacturer</th>
                        <td>{{ device.manufacturer }}</td>
                      </tr>
                      <tr v-if="device.protocol">
                        <th>protocol</th>
                        <td>{{ device.protocol }}</td>
                      </tr>
                      <tr v-if="device.serial">
                        <th>serial</th>
                        <td>{{ device.serial }}</td>
                      </tr>
                      <tr v-if="device.class">
                        <th>class</th>
                        <td>{{ device.subclass ? `${device.class}, ${device.subclass}` : device.class }}</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-card>
              </v-col>
            </v-row>
          </template>

          <template v-else-if="peripheralGroup.type === 'video'">
            <v-row
              v-for="(device, index) in peripherals.v4l2_devices"
              :key="index"
            >
              <v-col>
                <v-card outlined>
                  <v-card-title>{{ device.camera_name }}</v-card-title>
                  <v-card-subtitle>{{ device.hardware_bus }}</v-card-subtitle>

                  <v-divider />

                  <v-simple-table dense>
                    <tbody>
                      <tr>
                        <th>device_name</th>
                        <td>{{ device.device_name }}</td>
                      </tr>
                      <tr>
                        <th>device_path</th>
                        <td>{{ device.device_path }}</td>
                      </tr>
                      <tr v-if="device.path_by_id">
                        <th>path_by_id</th>
                        <td>{{ device.path_by_id }}</td>
                      </tr>
                      <tr v-if="device.path_by_hardware">
                        <th>path_by_hardware</th>
                        <td>{{ device.path_by_hardware }}</td>
                      </tr>
                      <tr v-if="device.usb_location">
                        <th>usb_location</th>
                        <td>{{ device.usb_location }}</td>
                      </tr>
                      <tr
                        v-for="mode in device.modes"
                        :key="mode.format"
                      >
                        <th>{{ mode.format }} resoulutions</th>
                        <td>{{ mode.resolutions.join(", ") }}</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-card>
              </v-col>
            </v-row>

            <v-row
              v-for="(device, index) in peripherals.libcamera_devices"
              :key="index"
            >
              <v-col>
                <v-card outlined>
                  <v-card-title>{{ device.model }}</v-card-title>
                  <v-card-subtitle>Libcamera</v-card-subtitle>

                  <v-divider />

                  <v-simple-table dense>
                    <tbody>
                      <tr>
                        <th>libcamera_id</th>
                        <td>{{ device.libcamera_id }}</td>
                      </tr>
                      <tr
                        v-for="mode in device.modes"
                        :key="mode.format"
                      >
                        <th>{{ mode.format }} resoulutions</th>
                        <td>{{ mode.resolutions.join(", ") }}</td>
                      </tr>
                    </tbody>
                  </v-simple-table>
                </v-card>
              </v-col>
            </v-row>
          </template>

          <template v-else-if="peripheralGroup.type === 'can'">
            <v-row
              v-for="(canUuids, canInterface, index) in canbusUuids"
              :key="index"
            >
              <v-col>
                <v-card outlined>
                  <v-card-title>{{ canInterface }}</v-card-title>

                  <v-divider />

                  <v-card-text>
                    <v-row
                      v-for="(canUuid, index2) in canUuids"
                      :key="index2"
                    >
                      <v-col>
                        <app-text-field-with-copy
                          :value="canUuid.uuid"
                          :label="canUuid.application"
                          outlined
                          persistent-placeholder
                          dense
                          readonly
                          hide-details
                        />
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </template>
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, VModel, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import type { CanbusUuid, Peripherals, SystemInfo } from '@/store/server/types'

type PeripheralType = 'serial' | 'usb' | 'video' | 'can'

type PeripheralGroup = {
  type: PeripheralType,
  count?: number
}

@Component({})
export default class ManualProbeDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  tab: number | null = null

  get peripherals (): Peripherals {
    return this.$store.state.server.peripherals as Peripherals
  }

  get canbusUuids (): Record<string, CanbusUuid[]> | null {
    return this.$store.state.server.can_uuids as Record<string, CanbusUuid[]> | null
  }

  get systemInfo (): SystemInfo | null {
    return this.$store.state.server.system_info as SystemInfo | null
  }

  get canbusInterfaces (): string[] {
    return Object.keys(this.systemInfo?.canbus ?? {})
  }

  get peripheralGroups (): PeripheralGroup[] {
    const peripheralGroups: PeripheralGroup[] = [
      {
        type: 'serial',
        count: this.peripherals.serial_devices?.length
      },
      {
        type: 'usb',
        count: this.peripherals.usb_devices?.length
      },
      {
        type: 'video',
        count: (
          this.peripherals.v4l2_devices && this.peripherals.libcamera_devices
            ? this.peripherals.v4l2_devices.length + this.peripherals.libcamera_devices.length
            : undefined
        )
      }
    ]

    if (this.canbusInterfaces.length > 0) {
      peripheralGroups.push({
        type: 'can',
        count: this.canbusUuids
          ? Object.values(this.canbusUuids)
            .reduce((a, b) => a + b.length, 0)
          : undefined
      })
    }

    return peripheralGroups
  }

  get currentPeripheralGroup (): PeripheralGroup | false {
    return this.tab != null && this.peripheralGroups[this.tab]
  }

  hasWaitFor (peripheralGroup: PeripheralGroup) {
    switch (peripheralGroup.type) {
      case 'serial':
        return this.hasWait(this.$waits.onMachinePeripheralsSerial)

      case 'usb':
        return this.hasWait(this.$waits.onMachinePeripheralsUsb)

      case 'video':
        return this.hasWait(this.$waits.onMachinePeripheralsVideo)

      case 'can':
        return this.hasWaitsBy(`${this.$waits.onMachinePeripheralsCanbus}/`)
    }
  }

  handleRefresh () {
    const currentPeripheralGroup = this.currentPeripheralGroup

    if (currentPeripheralGroup) {
      switch (currentPeripheralGroup.type) {
        case 'serial':
          SocketActions.machinePeripheralsSerial()
          break

        case 'usb':
          SocketActions.machinePeripheralsUsb()
          break

        case 'video':
          SocketActions.machinePeripheralsVideo()
          break

        case 'can':
          for (const canbusInterface in this.canbusInterfaces) {
            SocketActions.machinePeripheralsCanbus(canbusInterface)
          }
          break
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  :deep(.v-expansion-panel::before) {
    box-shadow: none;
  }
</style>
