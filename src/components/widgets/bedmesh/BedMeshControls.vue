<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh_controls')"
    :lazy="false"
    icon="$bedMesh"
  >
    <template #menu>
      <app-btn-collapse-group>
        <app-btn
          v-if="isManualProbeActive"
          :disabled="!klippyReady || printerPrinting"
          small
          class="me-1 my-1"
          @click="manualProbeDialogOpen = true"
        >
          {{ $t('app.tool.tooltip.manual_probe') }}
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <template v-if="bedMeshProfiles.length > 0">
      <v-simple-table>
        <thead>
          <tr>
            <th>{{ $t('app.general.label.name') }}</th>
            <th>&nbsp;</th>
            <th>{{ $t('app.general.label.range') }}</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in bedMeshProfiles"
            :key="item.name"
          >
            <td class="">
              {{ item.name }}
            </td>
            <td>
              <v-chip
                v-if="item.active"
                small
                block
              >
                {{ $t('app.bedmesh.label.active') }}
              </v-chip>
            </td>
            <td class="focus--text">
              <span>
                {{ item.range.toFixed(4) }}
              <!-- / {{ mesh.min }} / {{ mesh.mid }} / {{ mesh.max }} -->
              </span>
            </td>
            <td
              class="text-right"
              nowrap
            >
              <v-tooltip
                v-if="!item.active"
                bottom
              >
                <template #activator="{ on, attrs }">
                  <app-btn
                    v-bind="attrs"
                    icon
                    @click="loadProfile(item.name)"
                    v-on="on"
                  >
                    <v-icon dense>
                      $open
                    </v-icon>
                  </app-btn>
                </template>
                <span>{{ $t('app.bedmesh.tooltip.load') }}</span>
              </v-tooltip>

              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <app-btn
                    v-bind="attrs"
                    icon
                    :disabled="item.adaptive"
                    @click="removeProfile(item.name)"
                    v-on="on"
                  >
                    <v-icon dense>
                      $delete
                    </v-icon>
                  </app-btn>
                </template>
                <span>{{ $t('app.bedmesh.tooltip.delete') }}</span>
              </v-tooltip>
            </td>
          </tr>
        </tbody>
      </v-simple-table>

      <v-divider />
    </template>

    <v-card-text>
      <div
        v-if="bedMeshProfiles.length === 0"
        class="mb-4"
      >
        {{ $t('app.bedmesh.msg.not_found') }}
      </div>
      <v-row>
        <v-col cols="6">
          <app-btn
            :disabled="!meshLoaded"
            small
            block
            class="mb-2"
            @click="clearMesh()"
          >
            {{ $t('app.general.btn.clear_profile') }}
          </app-btn>

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                small
                block
                class="mb-2"
                :loading="hasWait($waits.onMeshCalibrate)"
                :disabled="printerBusy || !allHomed"
                v-on="on"
                @click="calibrate()"
              >
                {{ $t('app.general.btn.calibrate') }}
              </app-btn>
            </template>
            <span>{{ $t(`app.bedmesh.tooltip.calibrate`) }}</span>
          </v-tooltip>

          <v-tooltip bottom>
            <template #activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                block
                small
                color="primary"
                :disabled="!meshLoaded"
                v-on="on"
                @click="handleOpenSaveDialog()"
              >
                {{ $t('app.general.btn.save_as') }}
              </app-btn>
            </template>
            <span>{{ $t('app.bedmesh.tooltip.save') }}</span>
          </v-tooltip>
        </v-col>
        <v-col cols="6">
          <app-btn
            block
            small
            class="mb-2"
            :loading="hasWait($waits.onHomeAll)"
            :disabled="printerBusy"
            :color="(!allHomed) ? 'primary' : undefined"
            @click="homeAll"
          >
            <v-icon
              small
              class="mr-1"
            >
              $home
            </v-icon> {{ $t('app.general.btn.all') }}
          </app-btn>

          <app-btn
            v-if="printerSupportsQgl"
            :loading="hasWait($waits.onQGL)"
            :disabled="printerBusy"
            block
            class="mb-2"
            small
            @click="sendGcode('QUAD_GANTRY_LEVEL', $waits.onQGL)"
          >
            {{ $t('app.general.btn.quad_gantry_level') }}
          </app-btn>
        </v-col>
      </v-row>

      <v-row>
        <v-col
          cols="12"
          md="6"
        >
          <v-radio-group
            v-model="matrix"
            :disabled="!meshLoaded"
            column
            hide-details
            class="mt-0 mb-2"
          >
            <v-radio
              :label="$t('app.bedmesh.label.probed_matrix')"
              value="probed_matrix"
            />
            <v-radio
              :label="$t('app.bedmesh.label.mesh_matrix')"
              value="mesh_matrix"
            />
          </v-radio-group>
        </v-col>
        <v-col
          cols="12"
          md="6"
        >
          <v-checkbox
            v-model="wireframe"
            :disabled="!meshLoaded"
            :label="$t('app.bedmesh.label.wireframe')"
            hide-details
            class="mt-0"
          />

          <v-checkbox
            v-model="flatSurface"
            :disabled="!meshLoaded"
            :label="$t('app.bedmesh.label.flat_surface')"
            hide-details
            class="mt-1"
          />
        </v-col>
      </v-row>

      <v-row>
        <v-col>
          <v-slider
            v-model="mapScale"
            :label="$t('app.bedmesh.label.scale')"
            :disabled="!meshLoaded"
            :tick-labels="mapScaleLabels"
            :min="0"
            :max="0.2"
            step="0.1"
            ticks="always"
            tick-size="4"
          />

          <v-slider
            v-model="boxScale"
            :label="$t('app.bedmesh.label.box_scale')"
            :disabled="!meshLoaded"
            :tick-labels="boxScaleLabels"
            :min="1"
            :max="2"
            step="0.5"
            ticks="always"
            tick-size="4"
          />
        </v-col>
      </v-row>
    </v-card-text>

    <save-mesh-dialog
      v-if="saveDialogState.open"
      v-model="saveDialogState.open"
      :existing-name="saveDialogState.existingName"
      :adaptive="saveDialogState.adaptive"
      @save="handleMeshSave"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import SaveMeshDialog from './SaveMeshDialog.vue'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import type {
  MeshState,
  MatrixType,
  BedMeshProfileListEntry
} from '@/store/mesh/types'
import type { KlipperPrinterBedMeshState, KlipperPrinterSettings } from '@/store/printer/types'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component({
  components: {
    SaveMeshDialog
  }
})
export default class BedMesh extends Mixins(StateMixin, ToolheadMixin) {
  mapScaleLabels = ['min', '0.1', '0.2']
  boxScaleLabels = ['1.0', '1.5', '2.0']

  saveDialogState = {
    open: false,
    existingName: 'default',
    adaptive: false
  }

  get matrix () {
    return this.mesh.matrix
  }

  set matrix (val: MatrixType) {
    this.$typedDispatch('mesh/onMatrix', val)
  }

  get mapScale () {
    return this.mesh.scale
  }

  set mapScale (val: number) {
    this.$typedDispatch('mesh/onScale', val)
  }

  get boxScale () {
    return this.mesh.boxScale
  }

  set boxScale (val: number) {
    this.$typedDispatch('mesh/onBoxScale', val)
  }

  get wireframe () {
    return this.mesh.wireframe
  }

  set wireframe (val: boolean) {
    this.$typedDispatch('mesh/onWireframe', val)
  }

  get flatSurface () {
    return this.mesh.flatSurface
  }

  set flatSurface (val: boolean) {
    this.$typedDispatch('mesh/onFlatSurface', val)
  }

  get mesh (): MeshState {
    return this.$typedState.mesh
  }

  // The available meshes.
  get bedMeshProfiles (): BedMeshProfileListEntry[] {
    return this.$typedGetters['mesh/getBedMeshProfiles']
  }

  // The current mesh, unprocessed.
  get currentMesh (): KlipperPrinterBedMeshState | undefined {
    return this.$typedState.printer.printer.bed_mesh
  }

  // If we have a mesh loaded.
  get meshLoaded (): boolean {
    return !!this.currentMesh?.profile_name
  }

  // If the printer supports QGL
  get printerSupportsQgl (): boolean {
    const printerSettings: KlipperPrinterSettings = this.$typedGetters['printer/getPrinterSettings']

    return 'quad_gantry_level' in printerSettings
  }

  calibrate () {
    this.sendGcode('BED_MESH_CALIBRATE', this.$waits.onMeshCalibrate)
  }

  async clearMesh () {
    const result = (
      !this.printerPrinting ||
      await this.$confirm(
        this.$t('app.general.simple_form.msg.confirm_load_bedmesh_profile', { name }).toString(),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    )
    if (result) {
      this.sendGcode('BED_MESH_CLEAR')
    }
  }

  async loadProfile (name: string) {
    const result = (
      !this.printerPrinting ||
      await this.$confirm(
        this.$tc('app.general.simple_form.msg.confirm_clear_mesh'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )
    )

    if (result) {
      this.sendGcode(`BED_MESH_PROFILE LOAD=${encodeGcodeParamValue(name)}`)
    }
  }

  removeProfile (name: string) {
    this.sendGcode(`BED_MESH_PROFILE REMOVE=${encodeGcodeParamValue(name)}`)
  }

  handleMeshSave (config: { name: string; removeDefault: boolean }) {
    const profileName = this.currentMesh?.profile_name

    if (config.name !== profileName) {
      this.sendGcode(`BED_MESH_PROFILE SAVE=${encodeGcodeParamValue(config.name)}`)
    }

    if (config.removeDefault && profileName) {
      this.sendGcode(`BED_MESH_PROFILE REMOVE=${encodeGcodeParamValue(profileName)}`)
    }
  }

  handleOpenSaveDialog () {
    const profileName = this.currentMesh?.profile_name

    if (!profileName) {
      return
    }

    const profile = this.bedMeshProfiles.find(mesh => mesh.name === profileName)

    this.saveDialogState = {
      open: true,
      existingName: profileName,
      adaptive: profile?.adaptive ?? false
    }
  }
}
</script>

<style lang="scss" scoped>
  :deep(.v-input__slider .v-input__slot .v-label) {
    min-width: 82px;
  }
</style>
