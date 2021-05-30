<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh_controls')"
    :lazy="false"
    icon="$bedMesh">

    <v-simple-table v-if="meshes.length > 0" class="no-hover">
      <thead>
        <tr>
          <th>{{ $t('app.general.label.name') }}</th>
          <th>&nbsp;</th>
          <th>{{ $t('app.general.label.variance') }}</th>
          <th>&nbsp;</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in meshes" :key="item.profile_name">
          <td class="dim--text">
            {{ item.profile_name }}
          </td>
          <td>
            <v-chip
              v-if="item.active"
              small
              block>
              active
            </v-chip>
          </td>
          <td class="dim--text focus--text">
            <span v-if="item.active && mesh.variance">
              {{ mesh.variance.toFixed(4) }}
               <!-- / {{ mesh.min }} / {{ mesh.mid }} / {{ mesh.max }} -->
            </span>
          </td>
          <td class="text-right" nowrap>
            <v-tooltip
              v-if="!item.active && !printerPrinting && !printerBusy"
              bottom
            >
              <template v-slot:activator="{ on, attrs }">
                <app-btn
                  @click="loadProfile(item.profile_name)"
                  v-if="!item.active && !printerPrinting && !printerBusy"
                  v-bind="attrs"
                  v-on="on"
                  x-small
                  color=""
                  fab
                  text
                >
                  <v-icon>$open</v-icon>
                </app-btn>
              </template>
              <span>{{ $t('app.bedmesh.tooltip.load') }}</span>
            </v-tooltip>

            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <app-btn
                  @click="removeProfile(item.profile_name)"
                  :disabled="printerPrinting || printerBusy"
                  v-bind="attrs"
                  v-on="on"
                  color=""
                  class="ml-2"
                  fab
                  text
                  x-small>
                  <v-icon color="dim--text">$close</v-icon>
                </app-btn>
              </template>
              <span>{{ $t('app.bedmesh.tooltip.delete') }}</span>
            </v-tooltip>
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <v-divider />

    <v-card-text>
      <div class="mb-4" v-if="meshes.length === 0">{{ $t('app.bedmesh.msg.not_found') }}</div>
      <v-row>
        <v-col cols="6">
          <app-btn
            @click="clearMesh()"
            :disabled="!meshLoaded"
            small
            block
            class="mb-2"
          >
            {{ $t('app.general.btn.clear_profile') }}
          </app-btn>

          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                v-on="on"
                small
                block
                class="mb-2"
                :loading="hasWait(waits.onMeshCalibrate)"
                :disabled="printerPrinting || printerBusy"
                @click="calibrate()">
                {{ $t('app.general.btn.calibrate') }}
              </app-btn>
            </template>
            <span>{{ $t(`app.bedmesh.tooltip.calibrate`) }}</span>
          </v-tooltip>

          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                v-on="on"
                block
                small
                color="primary"
                :disabled="!meshLoaded || printerPrinting || printerBusy"
                @click="handleOpenSaveDialog()">
                {{ $t('app.general.btn.save_as') }}
              </app-btn>
            </template>
            <span>{{ $t('app.bedmesh.tooltip.save') }}</span>
          </v-tooltip>

        </v-col>
        <v-col cols="6">
          <app-btn
            @click="sendGcode('G28', waits.onHomeAll)"
            block
            small
            class="mb-2"
            :loading="hasWait(waits.onHomeAll)"
            :disabled="printerPrinting || printerBusy"
            :color="(!allHomed) ? 'primary' : undefined">
              <v-icon small class="mr-1">$home</v-icon> {{ $t('app.general.btn.all') }}
          </app-btn>

          <app-btn
            v-if="!printerPrinting && printerSupportsQgl"
            @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
            :elevation="2"
            :loading="hasWait(waits.onQGL)"
            :disabled="printerPrinting || printerBusy"
            block
            class="mb-2"
            small>
              {{ $t('app.general.btn.quad_gantry_level') }}
          </app-btn>

        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-radio-group
            :disabled="!meshLoaded || printerPrinting || printerBusy"
            v-model="matrix"
            column
            hide-details
            class="mt-0 mb-2"
          >
            <v-radio
              :label="$t('app.bedmesh.label.probed_matrix')"
              color="primary"
              value="probed_matrix"
            ></v-radio>
            <v-radio
              :label="$t('app.bedmesh.label.mesh_matrix')"
              color="primary"
              value="mesh_matrix"
            ></v-radio>
          </v-radio-group>

          <v-checkbox
            :disabled="!meshLoaded || printerPrinting || printerBusy"
            :label="$t('app.bedmesh.label.wireframe')"
            v-model="wireframe"
            hide-details
            class="mt-0"
          >
          </v-checkbox>

          <v-checkbox
            :disabled="!meshLoaded || printerPrinting || printerBusy"
            :label="$t('app.bedmesh.label.flat_surface')"
            v-model="flatSurface"
            hide-details
            class="mt-1"
          >
          </v-checkbox>

        </v-col>
        <v-col cols="12" md="6">
          <v-slider
            :label="$t('app.bedmesh.label.scale')"
            :disabled="!meshLoaded || printerPrinting || printerBusy"
            v-model="mapScale"
            :tick-labels="mapScaleLabels"
            :min="0"
            :max="0.2"
            step="0.1"
            ticks="always"
            tick-size="4"
          >
          </v-slider>

          <v-slider
            :label="$t('app.bedmesh.label.boxScale')"
            :disabled="!meshLoaded || printerPrinting || printerBusy"
            v-model="boxScale"
            :tick-labels="boxScaleLabels"
            :min="1"
            :max="2"
            step="0.5"
            ticks="always"
            tick-size="4"
          >
          </v-slider>

          <!-- <v-checkbox
            :disabled="!meshLoaded || printerPrinting || printerBusy"
            :label="$t('app.bedmesh.label.scale')"
            v-model="scale"
            hide-details
            class="mt-0"
          >
          </v-checkbox> -->

        </v-col>

      </v-row>

    </v-card-text>

    <save-mesh-dialog
      v-if="saveDialogState.open"
      v-model="saveDialogState.open"
      :existing-name="saveDialogState.existingName"
      @save="handleMeshSave"
    >
    </save-mesh-dialog>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import SaveMeshDialog from './SaveMeshDialog.vue'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import { KlipperMesh, ProcessedMesh } from '@/store/mesh/types'
import { Waits } from '@/globals'

@Component({
  components: {
    SaveMeshDialog
  }
})
export default class BedMesh extends Mixins(StateMixin, ToolheadMixin) {
  waits = Waits

  mapScaleLabels = ['min', '0.1', '0.2']
  boxScaleLabels = ['1.0', '1.5', '2.0']

  saveDialogState = {
    open: false,
    existingName: 'default'
  }

  get matrix () {
    return this.$store.state.mesh.matrix
  }

  set matrix (val: string) {
    this.$store.dispatch('mesh/onMatrix', val)
  }

  get mapScale () {
    return this.$store.state.mesh.scale
  }

  set mapScale (val: string) {
    this.$store.dispatch('mesh/onScale', val)
  }

  get boxScale () {
    return this.$store.state.mesh.boxScale
  }

  set boxScale (val: string) {
    this.$store.dispatch('mesh/onBoxScale', val)
  }

  get wireframe () {
    return this.$store.state.mesh.wireframe
  }

  set wireframe (val: string) {
    this.$store.dispatch('mesh/onWireframe', val)
  }

  get flatSurface () {
    return this.$store.state.mesh.flatSurface
  }

  set flatSurface (val: boolean) {
    this.$store.dispatch('mesh/onFlatSurface', val)
  }

  // The available meshes.
  get meshes (): KlipperMesh[] {
    return this.$store.getters['mesh/getBedMeshes']
  }

  // The current processed mesh data, if any.
  get mesh (): ProcessedMesh {
    return this.$store.getters['mesh/getCurrentMeshData'][this.matrix]
  }

  // The current mesh, unprocessed.
  get currentMesh (): KlipperMesh {
    return this.$store.state.printer.printer.bed_mesh
  }

  // If we have a mesh loaded.
  get meshLoaded (): boolean {
    return ('profile_name' in this.currentMesh && this.currentMesh.profile_name.length > 0)
  }

  // If we have a default profile.
  get hasDefault (): boolean {
    return (this.meshes.findIndex(mesh => mesh.profile_name === 'default') > -1)
  }

  // If the printer supports QGL
  get printerSupportsQgl (): boolean {
    const printerSettings = this.$store.getters['printer/getPrinterSettings']()
    return 'quad_gantry_level' in printerSettings
  }

  calibrate () {
    this.sendGcode('BED_MESH_CALIBRATE', Waits.onMeshCalibrate)
  }

  clearMesh () {
    this.sendGcode('BED_MESH_CLEAR')
  }

  loadProfile (name: string) {
    this.sendGcode(`BED_MESH_PROFILE LOAD="${name}"`)
  }

  removeProfile (name: string) {
    this.sendGcode(`BED_MESH_PROFILE REMOVE="${name}"`)
    this.sendGcode('SAVE_CONFIG')
  }

  handleMeshSave (config: {name: string; removeDefault: boolean}) {
    if (config.name !== this.currentMesh.profile_name) {
      this.sendGcode(`BED_MESH_PROFILE SAVE="${config.name}"`)
    }
    if (config.removeDefault) {
      this.sendGcode(`BED_MESH_PROFILE REMOVE="${this.currentMesh.profile_name}"`)
    }
    this.sendGcode('SAVE_CONFIG')
  }

  handleOpenSaveDialog () {
    this.saveDialogState = {
      open: true,
      existingName: this.currentMesh.profile_name
    }
  }
}
</script>

<style lang="scss" scoped>
  ::v-deep .v-input__slider .v-input__slot .v-label {
    min-width: 82px;
  }
</style>
