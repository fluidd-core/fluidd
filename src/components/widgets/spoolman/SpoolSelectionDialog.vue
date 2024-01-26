<template>
  <div>
    <v-dialog
      v-model="open"
      no-actions
      scrollable
      :max-width="isMobileViewport ? '90vw' : '75vw'"
    >
      <v-card>
        <v-toolbar
          dense
          class="mb-2"
        >
          <v-toolbar-title>
            <v-icon>$changeFilament</v-icon>
            {{ $tc('app.spoolman.title.spool_selection', targetMacro ? 2 : 1, { macro: targetMacro }) }}
          </v-toolbar-title>

          <v-spacer />

          <v-menu
            v-if="cameras.length > 1"
            v-model="cameraSelectionMenuOpen"
            location="top"
          >
            <template #activator="{ on }">
              <app-btn
                class="mr-2"
                v-on="on"
              >
                <v-icon
                  class="mr-1"
                  small
                >
                  $camera
                </v-icon>
                <template v-if="!isMobileViewport">
                  {{ $t('app.spoolman.btn.scan_code') }}
                </template>
              </app-btn>
            </template>

            <v-list>
              <v-list-item
                v-for="camera in cameras"
                :key="camera.id"
                @click="scanSource = camera.id"
              >
                <v-list-item-title>
                  <v-icon
                    small
                    class="mr-1"
                  >
                    $camera
                  </v-icon>
                  {{ camera.name }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
          <app-btn
            v-else-if="cameras.length"
            class="mr-2"
            @click="cameraScanSource = cameras[0].id"
          >
            <v-icon
              class="mr-1"
              small
            >
              $camera
            </v-icon>
            <template v-if="!isMobileViewport">
              {{ $t('app.spoolman.btn.scan_code') }}
            </template>
          </app-btn>

          <v-text-field
            v-model="search"
            outlined
            dense
            single-line
            hide-details
            append-icon="$magnify"
            style="max-width: 360px"
          />
        </v-toolbar>

        <v-card-text>
          <v-data-table
            :items="availableSpools"
            :headers="headers"
            :search="search"
            :custom-filter="filterResults"
            :no-data-text="$t('app.file_system.msg.not_found')"
            :no-results-text="$t('app.file_system.msg.not_found')"
            :sort-by="sortOrder.key ?? undefined"
            :sort-desc="sortOrder.desc ?? undefined"
            mobile-breakpoint="0"
            class="file-system spool-table"
            hide-default-footer
            disable-pagination
            @update:sort-by="handleSortOrderKeyChange"
            @update:sort-desc="handleSortOrderDescChange"
          >
            <template #item="{ item }">
              <tr
                :class="{ 'v-data-table__selected': (item.id === selectedSpool) }"
                class="row-select px-1"
                @click.prevent="selectedSpool = selectedSpool === item.id ? null : item.id"
              >
                <td>
                  <div class="d-flex">
                    <v-icon
                      :color="`#${item.filament.color_hex ?? ($vuetify.theme.dark ? 'fff' : '000')}`"
                      x-large
                      class="mr-4 flex-column"
                    >
                      {{ item.id === selectedSpool ? '$markedCircle' : '$filament' }}
                    </v-icon>
                    <div class="flex-column">
                      <div class="flex-row">
                        {{ item.filament_name }}
                      </div>
                      <div class="flex-row">
                        <small>
                          <b>{{ $filters.getReadableWeightString(item.remaining_weight) }}</b>
                          / {{ $filters.getReadableWeightString(item.filament.weight) }}
                        </small>
                      </div>
                    </div>
                  </div>
                </td>
                <td>{{ item.id }}</td>
                <td>{{ item.filament.material }}</td>
                <td>{{ item.location }}</td>
                <td>{{ item.comment }}</td>
                <td>{{ item.last_used ? $filters.formatRelativeTimeToNow(item.last_used) : $tc('app.setting.label.never') }}</td>
              </tr>
            </template>
          </v-data-table>
        </v-card-text>

        <v-divider />

        <v-card-actions
          class="pt-4"
        >
          <app-btn
            v-if="spoolmanURL"
            :href="spoolmanURL"
            target="_blank"
          >
            <v-icon
              small
              class="mr-2"
            >
              $edit
            </v-icon>
            {{ isMobileViewport ? '' : $tc('app.spoolman.btn.manage_spools') }}
          </app-btn>

          <v-spacer />

          <app-btn
            text
            color="warning"
            @click="open = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            color="primary"
            @click="handleSelectSpool"
          >
            <v-icon class="mr-2">
              {{ filename ? '$printer' : '$send' }}
            </v-icon>
            {{ filename ? $t('app.general.btn.print') : $tc('app.spoolman.btn.select', targetMacro ? 2 : 1, { macro: targetMacro }) }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <QRReader
      v-if="scanSource"
      v-model="scanSource"
      @detected="handleQRCodeDetected"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import type { MacroWithSpoolId, Spool } from '@/store/spoolman/types'
import BrowserMixin from '@/mixins/browser'
import QRReader from '@/components/widgets/spoolman/QRReader.vue'
import type { CameraConfig } from '@/store/cameras/types'
import QrScanner from 'qr-scanner'

@Component({
  components: { QRReader }
})
export default class SpoolSelectionDialog extends Mixins(StateMixin, BrowserMixin) {
  search = ''
  selectedSpoolId: number | null = null

  cameraScanSource: null | string = null
  cameraSelectionMenuOpen = false

  hasDeviceCamera = false

  async mounted () {
    this.hasDeviceCamera = await QrScanner.hasCamera()
  }

  @Watch('open')
  onOpen () {
    if (this.open) {
      this.selectedSpoolId = this.$store.state.spoolman.activeSpool ?? null
      if (this.targetMacro) {
        const macro: MacroWithSpoolId | undefined = this.$store.getters['macros/getMacroByName'](this.targetMacro.toLowerCase())
        this.selectedSpoolId = macro?.variables.spool_id ?? null
      }

      if (this.currentFileName) {
        // prefetch file metadata
        SocketActions.serverFilesMetadata(this.currentFileName)
      }

      if (this.hasDeviceCamera && this.preferDeviceCamera) {
        this.$nextTick(() => (this.cameraScanSource = 'device'))
      } else {
        const autoOpenCameraId = this.autoOpenQRDetectionCamera
        if (this.$store.getters['cameras/getCameraById'](autoOpenCameraId)) {
          this.$nextTick(() => (this.cameraScanSource = autoOpenCameraId))
        }
      }
    }
  }

  get open () {
    return this.$store.state.spoolman.dialog.show
  }

  set open (val: boolean) {
    this.$store.commit('spoolman/setDialogState', {
      ...this.$store.state.spoolman.dialog,
      show: val
    })
  }

  get availableSpools (): Spool[] {
    const spools = []
    for (const spool of this.$store.state.spoolman.availableSpools) {
      if (spool.archived) {
        continue
      }

      let filamentName = spool.filament.name
      if (spool.filament.vendor) {
        filamentName = `${spool.filament.vendor.name} - ${filamentName}`
      }

      spools.push({
        ...spool,
        filament_name: filamentName,
        filament_material: spool.filament.material
      })
    }

    return spools
  }

  get headers () {
    return [
      'filament_name',
      'id',
      'material',
      'location',
      'comment',
      'last_used'
    ].map((value) => ({
      text: this.$tc(`app.spoolman.label.${value}`),
      value
    }))
  }

  get selectedSpool () {
    return this.selectedSpoolId
  }

  set selectedSpool (id: number | null) {
    this.selectedSpoolId = id
  }

  get filename () {
    let filename = this.$store.state.spoolman.dialog.filename

    if (!filename) {
      return
    } else if (filename.startsWith('/')) {
      filename = filename.slice(1)
    }

    return filename
  }

  get currentFileName () {
    return this.filename || this.$store.state.printer.printer.print_stats.filename
  }

  get currentFile () {
    const splitFilepath = this.currentFileName.split('/')
    const filename = splitFilepath.pop()
    const filepath = splitFilepath.join('/')
    return this.$store.getters['files/getFile'](filepath ? `gcodes/${filepath}` : 'gcodes', filename)
  }

  get targetMacro (): string | undefined {
    return this.$store.state.spoolman.dialog.targetMacro
  }

  get cameras () {
    const cameras = this.$store.getters['cameras/getEnabledCameras']
      .filter((camera: CameraConfig) => camera.service !== 'iframe')

    if (this.hasDeviceCamera) {
      // always show device camera first
      cameras.unshift({ name: this.$t('app.spoolman.label.device_camera'), id: 'device' })
    }

    return cameras
  }

  get scanSource () {
    return this.cameraScanSource
  }

  set scanSource (source) {
    this.cameraScanSource = source
  }

  handleQRCodeDetected (id: number) {
    this.cameraScanSource = null
    this.selectedSpoolId = id
    if (
      !this.availableSpools
        .filter(spool => this.filterResults('', this.search, spool))
        .some(spool => spool.id === id)
    ) {
      // clear filter if selected spool isn't in filter results
      this.search = ''
    }

    if (this.autoSelectSpoolOnMatch) {
      this.handleSelectSpool()
    }
  }

  async handleSelectSpool () {
    if (!this.selectedSpool) {
      // no spool selected

      const confirmation = await this.$confirm(
        this.$tc('app.spoolman.msg.no_spool'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
      )

      if (!confirmation) {
        return
      }
    }

    const spool = this.availableSpools.find(spool => spool.id === this.selectedSpool)
    if (spool && this.filename && (this.warnOnFilamentTypeMismatch || this.warnOnNotEnoughFilament)) {
      let requiredLength = 0 // l[mm]

      if (this.currentFile) {
        if (this.warnOnFilamentTypeMismatch) {
          const fileMaterials = this.currentFile.filament_type?.toLowerCase()
            .split(';').map((x: string) => x.replace(/"/g, ''))
          const spoolMaterial = spool.filament.material?.toLowerCase()
          if (spoolMaterial && fileMaterials && !fileMaterials.includes(spoolMaterial)) {
            // filament materials don't match

            const confirmation = await this.$confirm(
              this.$tc('app.spoolman.msg.mismatched_filament'),
              { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
            )

            if (!confirmation) {
              return
            }
          }
        }

        requiredLength = this.currentFile?.filament_total ?? 0
        if (this.$store.getters['printer/getPrinterState'] !== 'idle') {
          // subtract already printed length
          requiredLength -= this.$store.state.printer.printer.print_stats?.filament_used ?? 0
          requiredLength = Math.max(requiredLength, 0)
        }
      }

      if (!requiredLength) {
        // missing file metadata

        const confirmation = await this.$confirm(
          this.$tc('app.spoolman.msg.no_required_length'),
          { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
        )

        if (!confirmation) {
          return
        }
      }

      if (this.warnOnNotEnoughFilament) {
        let remainingLength = spool.remaining_length
        if (!remainingLength && spool.remaining_weight) {
          // l[mm] = m[g]/D[g/cm³]/A[mm²]*(1000mm³/cm³)
          remainingLength = spool.remaining_weight / spool.filament.density / (Math.PI * (spool.filament.diameter / 2) ** 2) * 1000
        }

        if (typeof remainingLength === 'number' && requiredLength >= remainingLength) {
          // not enough filament

          const confirmation = await this.$confirm(
            this.$tc('app.spoolman.msg.no_filament'),
            { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
          )

          if (!confirmation) {
            return
          }
        }
      }
    }

    if (this.targetMacro) {
      // set spool_id via SET_GCODE_VARIABLE
      const commands = [
        `SET_GCODE_VARIABLE MACRO=${this.targetMacro} VARIABLE=spool_id VALUE=${this.selectedSpool ?? 'None'}`
      ]

      const supportsSaveVariables = this.$store.getters['printer/getPrinterConfig']('save_variables')
      if (supportsSaveVariables) {
        // persist selected spool across restarts
        commands.push(`SAVE_VARIABLE VARIABLE=${this.targetMacro.toUpperCase()}__SPOOL_ID VALUE=${this.selectedSpool ?? 'None'}`)
      }

      await SocketActions.printerGcodeScript(commands.join('\n'))

      this.open = false
      return
    }

    await SocketActions.serverSpoolmanPostSpoolId(this.selectedSpool ?? undefined)
    if (this.filename) {
      await SocketActions.printerPrintStart(this.filename)

      if (this.$router.currentRoute.path !== '/') {
        this.$router.push({ path: '/' })
      }
    }

    this.open = false
  }

  filterResults (value: string, query: string, item: Spool): boolean {
    query = query.toLowerCase()
    return [item.comment, item.filament.name, item.filament.material, item.filament.vendor?.name]
      .some(val => val?.toLowerCase().includes(query))
  }

  get spoolmanURL () {
    return this.$store.state.server.config.spoolman?.server
  }

  get preferDeviceCamera () {
    return this.$store.state.config.uiSettings.spoolman.preferDeviceCamera
  }

  get autoOpenQRDetectionCamera () {
    return this.$store.state.config.uiSettings.spoolman.autoOpenQRDetectionCamera
  }

  get autoSelectSpoolOnMatch () {
    return this.$store.state.config.uiSettings.spoolman.autoSelectSpoolOnMatch
  }

  get warnOnNotEnoughFilament () {
    return this.$store.state.config.uiSettings.spoolman.warnOnNotEnoughFilament
  }

  get warnOnFilamentTypeMismatch (): boolean {
    return this.$store.state.config.uiSettings.spoolman.warnOnFilamentTypeMismatch
  }

  get sortOrder () {
    return this.$store.state.config.uiSettings.spoolman.selectionDialogSortOrder
  }

  handleSortOrderKeyChange (value?: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.selectionDialogSortOrder.key',
      value: value ?? null,
      server: true
    })
  }

  handleSortOrderDescChange (value?: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.selectionDialogSortOrder.desc',
      value: value ?? null,
      server: true
    })
  }
}
</script>

<style lang="scss" scoped>
  .spool-table tr td {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }
</style>
