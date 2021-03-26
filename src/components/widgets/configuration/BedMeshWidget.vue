<template>
  <v-card-text>
    <v-row>
      <v-col cols="12" lg="8">
        <span v-if="meshes.length === 0">{{ $t('app.bedmesh.msg.not_found') }}</span>
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
            <tr v-for="mesh in meshes" :key="mesh.profile_name">
              <td class="grey--text">
                {{ mesh.profile_name }}
              </td>
              <td>
                <v-chip
                  v-if="mesh.active"
                  small
                  block>
                  active
                </v-chip>
              </td>
              <td class="grey--text focus--text"><span v-if="mesh.active">{{ variance.toFixed(4) }}</span></td>
              <td>
                <v-tooltip left>
                  <template v-slot:activator="{ on, attrs }">
                    <btn
                      @click="loadProfile(mesh.profile_name)"
                      :disabled="mesh.active || hasWaits || printerPrinting || printerBusy"
                      v-bind="attrs"
                      v-on="on"
                      small
                      icon>
                      <v-icon small class="grey--text">$open</v-icon>
                    </btn>
                  </template>
                  <span>{{ $t('app.bedmesh.tooltip.load') }}</span>
                </v-tooltip>
                <v-tooltip right>
                  <template v-slot:activator="{ on, attrs }">
                    <v-btn
                      @click="removeProfile(mesh.profile_name)"
                      :disabled="hasWaits || printerPrinting || printerBusy"
                      v-bind="attrs"
                      v-on="on"
                      color="primary"
                      class="ml-2"
                      icon
                      small>
                      <v-icon small>$delete</v-icon>
                    </v-btn>
                  </template>
                  <span>{{ $t('app.bedmesh.tooltip.delete') }}</span>
                </v-tooltip>
              </td>
            </tr>
            <tr>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>
                <btn
                  @click="clearMesh()"
                  :disabled="!meshLoaded"
                  small>
                  {{ $t('app.general.btn.clear_profile') }}
                </btn>
              </td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-col>
      <v-col cols="12" lg="4">
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <btn
              v-bind="attrs"
              v-on="on"
              block
              class="mb-2"
              :loading="hasWait(waits.onMeshCalibrate)"
              :disabled="hasWaits || printerPrinting || printerBusy"
              @click="calibrate()">
              {{ $t('app.general.btn.calibrate') }}
            </btn>
          </template>
          <span>{{ $t(`app.bedmesh.tooltip.calibrate`) }}</span>
        </v-tooltip>
        <btn
          @click="sendGcode('G28', waits.onHomeAll)"
          block
          class="mb-2"
          :loading="hasWait(waits.onHomeAll)"
          :disabled="hasWaits || printerPrinting || printerBusy"
          :color="(!allHomed) ? 'primary' : undefined">
            <v-icon small class="mr-1">$home</v-icon> {{ $t('app.general.btn.all') }}
        </btn>
        <btn
          v-if="!printerPrinting && printerSupportsQgl"
          @click="sendGcode('QUAD_GANTRY_LEVEL', waits.onQGL)"
          :elevation="2"
          :loading="hasWait(waits.onQGL)"
          :disabled="hasWaits || printerPrinting || printerBusy"
          block
          class="mb-2">
            {{ $t('app.general.btn.quad_gantry_level') }}
        </btn>
        <v-tooltip right>
          <template v-slot:activator="{ on, attrs }">
            <btn
              v-bind="attrs"
              v-on="on"
              block
              class="mb-2"
              color="primary"
              :disabled="!meshLoaded || hasWaits || printerPrinting || printerBusy"
              @click="openSaveDialog()">
              {{ $t('app.general.btn.save_as') }}
            </btn>
          </template>
          <span>{{ $t('app.bedmesh.tooltip.save') }}</span>
        </v-tooltip>
      </v-col>
    </v-row>

    <v-dialog
      :title="$t('app.general.label.save_as')"
      v-model="saveDialog.open"
      :max-width="450"
    >

      <v-form
        ref="saveMeshForm"
        @submit.prevent="saveToConfig()"
        v-model="saveDialog.valid"
      >
        <v-card>
          <v-card-title>
            <span class="headline">{{ $t('app.general.label.save_as') }}</span>
          </v-card-title>
          <v-card-text>

            <v-text-field
              autofocus
              filled
              required
              class="mb-4"
              :rules="rules"
              hide-details="auto"
              :label="$t('app.bedmesh.label.profile_name')"
              v-model="saveDialog.profileName">
            </v-text-field>

            <v-checkbox
              :label="$t('app.bedmesh.label.remove_profile', { name: currentMesh.profile_name })"
              hide-details="auto"
              class="mb-4"
              v-model="saveDialog.removeDefault"
              :disabled="saveDialog.profileName === currentMesh.profile_name"
              ></v-checkbox>

              <p>
                {{ $t('app.bedmesh.msg.hint', { name: currentMesh.profile_name }) }}
              </p>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <btn color="warning" text @click="saveDialog.open = false" type="button">{{ $t('app.general.btn.cancel') }}</btn>
            <btn color="primary" :elevation="2" type="submit">{{ $t('app.general.btn.save') }}</btn>
          </v-card-actions>

        </v-card>
      </v-form>
    </v-dialog>

    <Plotly v-if="meshLoaded" :data="data" :layout="layout" :display-mode-bar="false"></Plotly>
  </v-card-text>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import { BedMesh } from '@/store/printer/types'
import { MeshData } from '@/types'
import { defaultPlotLayout, Waits } from '@/globals'
import { Plotly } from '@cadriel/vue-plotly'
import { VForm } from '@/types/vuetify'

@Component({
  components: {
    Plotly
  }
})
export default class BedMeshWidget extends Mixins(StateMixin, ToolheadMixin) {
  waits = Waits
  layout = defaultPlotLayout
  variance = 0
  saveDialog = {
    valid: false,
    open: false,
    profileName: 'default',
    removeDefault: false
  }

  rules = [
    (v: string) => !!v || this.$t('app.general.simple_form.error.required')
  ]

  @Watch('saveDialog', { deep: true })
  onSaveDialogChange () {
    if (this.saveDialog.profileName === this.currentMesh.profile_name) {
      this.saveDialog.removeDefault = false
    }
  }

  get meshes (): BedMesh[] {
    return this.$store.getters['printer/getBedMeshes']
  }

  get currentMesh (): BedMesh {
    return this.$store.state.printer.printer.bed_mesh
  }

  get meshLoaded (): boolean {
    return ('profile_name' in this.currentMesh && this.currentMesh.profile_name.length > 0)
  }

  get hasDefault (): boolean {
    return (this.meshes.findIndex(mesh => mesh.profile_name === 'default') > -1)
  }

  get form (): VForm {
    return this.$refs.saveMeshForm as VForm
  }

  get printerSupportsQgl (): boolean {
    const printerSettings = this.$store.getters['printer/getPrinterSettings']()
    return 'quad_gantry_level' in printerSettings
  }

  @Watch('currentMesh', { deep: true })
  onCurrentMeshChange (val: BedMesh) {
    if (val) {
      this.applyMesh(val)
    }
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

  saveToConfig () {
    const valid = this.form.validate()
    if (valid) {
      if (this.saveDialog.profileName !== this.currentMesh.profile_name) {
        this.sendGcode(`BED_MESH_PROFILE SAVE="${this.saveDialog.profileName}"`)
      }
      if (this.saveDialog.removeDefault) {
        this.sendGcode(`BED_MESH_PROFILE REMOVE="${this.currentMesh.profile_name}"`)
      }
      this.sendGcode('SAVE_CONFIG')
    }
  }

  mounted () {
    if (this.currentMesh) {
      this.applyMesh(this.currentMesh)
    }
  }

  openSaveDialog () {
    this.saveDialog.profileName = this.currentMesh.profile_name
    this.saveDialog.open = true
  }

  data: MeshData[] = [
    {
      x: [],
      y: [],
      z: [],
      type: 'surface',
      intensity: [0, 0.05, 0.1],
      cmin: -0.1,
      cmax: 0.1,
      showscale: true,
      // autocolorscale: true,
      // colorscale: 'Rainbow',
      colorscale: [[0, 'rebeccapurple'], [0.1, 'rebeccapurple'], [0.2, 'blue'], [0.5, 'green'], [0.8, 'yellow'], [0.9, 'red'], [1, 'red']],
      colorbar: {
        tickfont: {
          color: '#999'
        }
      }
    }
  ]

  /**
   * Applies given mesh data to the plotly graph.
   */
  applyMesh (mesh: BedMesh) {
    // const mesh: BedMesh = this.currentMesh

    if (mesh) {
      // Reset any existing mesh.
      this.data[0].x = []
      this.data[0].y = []
      this.data[0].z = []

      // Define the range for our X and Y axes.
      // If possible, use the actual range from config - otherwise revert to klippers given min and max's.
      const stepperX = this.$store.getters['printer/getPrinterSettings']('stepper_x')
      const stepperY = this.$store.getters['printer/getPrinterSettings']('stepper_y')

      const layout = defaultPlotLayout

      if (
        mesh.mesh_matrix &&
        mesh.mesh_matrix.length &&
        mesh.mesh_matrix[0].length &&
        mesh.mesh_max &&
        mesh.mesh_min
      ) {
        if (stepperX && stepperY) {
          layout.scene.xaxis.range = [stepperX.position_min, stepperX.position_max]
          layout.scene.yaxis.range = [stepperY.position_min, stepperY.position_max]
        } else {
          layout.scene.xaxis.range = [mesh.mesh_min[0], mesh.mesh_max[0]]
          layout.scene.yaxis.range = [mesh.mesh_min[1], mesh.mesh_max[1]]
        }

        const xCount = mesh.mesh_matrix[0].length
        const yCount = mesh.mesh_matrix.length
        this.data[0].z = mesh.mesh_matrix
        let zMin = Math.min(...mesh.mesh_matrix.map(row => Math.min(...row)))
        let zMax = Math.max(...mesh.mesh_matrix.map(row => Math.max(...row)))
        this.variance = Math.abs(zMin - zMax)

        const xStep = (mesh.mesh_max[0] - mesh.mesh_min[0]) / (xCount - 1)
        for (let i = 0; i < xCount; i++) {
          this.data[0].x.push(mesh.mesh_min[0] + xStep * i)
        }

        const yStep = (mesh.mesh_max[1] - mesh.mesh_min[1]) / (yCount - 1)
        for (let i = 0; i < yCount; i++) {
          this.data[0].y.push(mesh.mesh_min[1] + yStep * i)
        }

        // If the zmin and zmax don't exceed -1 and 1 respectively - then
        // set the min and maxes to -1 and 1 - effectively ensuring we don't
        // have a min max smaller than -1 and 1.
        if (zMin > -1) zMin = -1
        if (zMax < 1) zMax = 1

        layout.scene.zaxis.range = [zMin, zMax]

        this.layout = layout
      }
    }
  }
}
</script>
