<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh_controls')"
    :lazy="false"
    icon="$bedMesh"
  >
    <v-simple-table
      v-if="meshes.length > 0"
      class="no-hover"
    >
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
          v-for="item in meshes"
          :key="item.profile_name"
        >
          <td class="">
            {{ item.profile_name }}
          </td>
          <td>
            <v-chip
              v-if="item.active"
              small
              block
            >
              active
            </v-chip>
          </td>
          <td class="focus--text">
            <span v-if="item.active && mesh.variance">
              {{ mesh.variance.toFixed(4) }}
              <!-- / {{ mesh.min }} / {{ mesh.mid }} / {{ mesh.max }} -->
            </span>
          </td>
          <td
            class="text-right"
            nowrap
          >
            <v-tooltip
              v-if="!item.active && !printerPrinting && !printerBusy"
              bottom
            >
              <template #activator="{ on, attrs }">
                <app-btn
                  v-if="!item.active && !printerPrinting && !printerBusy"
                  v-bind="attrs"
                  x-small
                  color=""
                  fab
                  text
                  @click="loadProfile(item.profile_name)"
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
                  :disabled="printerPrinting || printerBusy"
                  v-bind="attrs"
                  color=""
                  class="ml-2"
                  fab
                  text
                  x-small
                  @click="removeProfile(item.profile_name)"
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

    <v-card-text>
      <div
        v-if="meshes.length === 0"
        class="mb-4"
      >
        {{ $t('app.bedmesh.msg.not_found') }}
      </div>
      <v-row>
        <v-col cols="6">
          <app-btn
            :disabled="!meshLoaded || printerPrinting || printerBusy"
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
                :loading="hasWait(waits.onMeshCalibrate)"
                :disabled="printerPrinting || printerBusy"
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
                :disabled="!meshLoaded || printerPrinting || printerBusy"
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
            :loading="hasWait(waits.onHomeAll)"
            :disabled="printerPrinting || printerBusy"
            :color="(!allHomed) ? 'primary' : undefined"
            @click="sendGcode('G28', waits.onHomeAll)"
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
            :elevation="2"
            :loading="hasWait(waits.onQGL)"
            :disabled="printerPrinting || printerBusy"
            block
            class="mb-2"
            small
            @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
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
              color="primary"
              value="probed_matrix"
            />
            <v-radio
              :label="$t('app.bedmesh.label.mesh_matrix')"
              color="primary"
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
    this.sendGcode('SAVE_CONFIG', this.waits.onSaveConfig)
  }

  handleMeshSave (config: {name: string; removeDefault: boolean}) {
    if (config.name !== this.currentMesh.profile_name) {
      this.sendGcode(`BED_MESH_PROFILE SAVE="${config.name}"`)
    }
    if (config.removeDefault) {
      this.sendGcode(`BED_MESH_PROFILE REMOVE="${this.currentMesh.profile_name}"`)
    }
    this.sendGcode('SAVE_CONFIG', this.waits.onSaveConfig)
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
