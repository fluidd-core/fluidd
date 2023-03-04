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
          class="ms-1 my-1"
          @click="manualProbeDialogOpen = true"
        >
          {{ $t('app.tool.tooltip.manual_probe') }}
        </app-btn>
      </app-btn-collapse-group>
    </template>

    <template v-if="bedMeshProfiles.length > 0">
      <v-simple-table class="no-hover">
        <thead>
          <tr>
            <th>{{ $t('app.general.label.name') }}</th>
            <th>&nbsp;</th>
            <th>{{ $t('app.general.label.variance') }}</th>
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
                {{ item.variance.toFixed(4) }}
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
                    x-small
                    color=""
                    fab
                    text
                    @click="loadProfile(item.name)"
                    v-on="on"
                  >
                    <v-icon>$open</v-icon>
                  </app-btn>
                </template>
                <span>{{ $t('app.bedmesh.tooltip.load') }}</span>
              </v-tooltip>

              <v-tooltip bottom>
                <template #activator="{ on, attrs }">
                  <app-btn
                    v-bind="attrs"
                    color=""
                    class="ml-2"
                    fab
                    text
                    x-small
                    @click="removeProfile(item.name)"
                    v-on="on"
                  >
                    <v-icon color="">
                      $close
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
                :disabled="printerBusy"
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
            @click="sendGcode('G28', $waits.onHomeAll)"
          >
            <v-icon
              small
              class="mr-1"
            >
              $home
            </v-icon> {{ $t('app.general.btn.all') }}
          </app-btn>

          <app-btn
            v-if="!printerPrinting && printerSupportsQgl"
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
      @save="handleMeshSave"
    />

    <manual-probe-dialog
      v-if="manualProbeDialogOpen"
      v-model="manualProbeDialogOpen"
    />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import SaveMeshDialog from './SaveMeshDialog.vue'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import { MeshState, BedMeshProfile, KlipperBedMesh, MatrixType } from '@/store/mesh/types'

@Component({
  components: {
    SaveMeshDialog
  }
})
export default class BedMesh extends Mixins(StateMixin, ToolheadMixin) {
  manualProbeDialogOpen = false

  mapScaleLabels = ['min', '0.1', '0.2']
  boxScaleLabels = ['1.0', '1.5', '2.0']

  saveDialogState = {
    open: false,
    existingName: 'default'
  }

  get matrix () {
    return this.mesh.matrix
  }

  set matrix (val: MatrixType) {
    this.$store.dispatch('mesh/onMatrix', val)
  }

  get mapScale () {
    return this.mesh.scale
  }

  set mapScale (val: number) {
    this.$store.dispatch('mesh/onScale', val)
  }

  get boxScale () {
    return this.mesh.boxScale
  }

  set boxScale (val: number) {
    this.$store.dispatch('mesh/onBoxScale', val)
  }

  get wireframe () {
    return this.mesh.wireframe
  }

  set wireframe (val: boolean) {
    this.$store.dispatch('mesh/onWireframe', val)
  }

  get flatSurface () {
    return this.mesh.flatSurface
  }

  set flatSurface (val: boolean) {
    this.$store.dispatch('mesh/onFlatSurface', val)
  }

  get mesh () {
    return this.$store.state.mesh as MeshState
  }

  // The available meshes.
  get bedMeshProfiles () {
    return this.$store.getters['mesh/getBedMeshProfiles'] as BedMeshProfile[]
  }

  // The current mesh, unprocessed.
  get currentMesh () {
    return this.$store.state.printer.printer.bed_mesh as KlipperBedMesh
  }

  // If we have a mesh loaded.
  get meshLoaded (): boolean {
    return ('profile_name' in this.currentMesh && this.currentMesh.profile_name.length > 0)
  }

  // If we have a default profile.
  get hasDefault (): boolean {
    return (this.bedMeshProfiles.findIndex(mesh => mesh.name === 'default') > -1)
  }

  // If the printer supports QGL
  get printerSupportsQgl (): boolean {
    const printerSettings = this.$store.getters['printer/getPrinterSettings']()
    return 'quad_gantry_level' in printerSettings
  }

  calibrate () {
    this.sendGcode('BED_MESH_CALIBRATE', this.$waits.onMeshCalibrate)
  }

  clearMesh () {
    this.sendGcode('BED_MESH_CLEAR')
  }

  loadProfile (name: string) {
    this.sendGcode(`BED_MESH_PROFILE LOAD="${name}"`)
  }

  removeProfile (name: string) {
    this.sendGcode(`BED_MESH_PROFILE REMOVE="${name}"`)
  }

  handleMeshSave (config: {name: string; removeDefault: boolean}) {
    if (config.name !== this.currentMesh.profile_name) {
      this.sendGcode(`BED_MESH_PROFILE SAVE="${config.name}"`)
    }
    if (config.removeDefault) {
      this.sendGcode(`BED_MESH_PROFILE REMOVE="${this.currentMesh.profile_name}"`)
    }
  }

  handleOpenSaveDialog () {
    this.saveDialogState = {
      open: true,
      existingName: this.currentMesh.profile_name
    }
  }

  get showManualProbeDialogAutomatically () {
    return this.$store.state.config.uiSettings.general.showManualProbeDialogAutomatically
  }

  @Watch('isManualProbeActive')
  onIsManualProbeActive (value: boolean) {
    if (value && this.showManualProbeDialogAutomatically &&
      this.klippyReady && !this.printerPrinting) {
      this.manualProbeDialogOpen = true
    }
  }
}
</script>

<style lang="scss" scoped>
  :deep(.v-input__slider .v-input__slot .v-label) {
    min-width: 82px;
  }
</style>
