<template>
  <app-dialog
    v-model="open"
    scrollable
    :max-width="$vuetify.breakpoint.mdAndDown ? '90vw' : '75vw'"
    :title="$tc('app.spoolman.title.spool_selection', targetMacro ? 2 : 1, { macro: targetMacro?.toUpperCase() })"
    title-shadow
  >
    <template #menu>
      <v-menu
        v-if="availableCameras.length > 1"
        left
        offset-y
        transition="slide-y-transition"
      >
        <template #activator="{ on, attrs, value }">
          <app-btn
            v-bind="attrs"
            small
            class="me-1 my-1"
            v-on="on"
          >
            <v-icon
              class="mr-1"
              small
            >
              $camera
            </v-icon>
            {{ $t('app.spoolman.btn.scan_code') }}
            <v-icon
              small
              class="ml-1"
              :class="{ 'rotate-180': value }"
            >
              $chevronDown
            </v-icon>
          </app-btn>
        </template>
        <v-list dense>
          <v-list-item
            v-for="camera in availableCameras"
            :key="camera.uid"
            @click="cameraScanSource = camera.uid"
          >
            <v-list-item-icon>
              <v-icon>
                $camera
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>
                {{ camera.name }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>

      <app-btn
        v-else-if="availableCameras.length"
        small
        class="me-1 my-1"
        @click="cameraScanSource = availableCameras[0].uid"
      >
        <v-icon
          class="mr-1"
          small
        >
          $camera
        </v-icon>
        {{ $t('app.spoolman.btn.scan_code') }}
      </app-btn>
    </template>

    <v-toolbar dense>
      <v-spacer />

      <app-column-picker
        key-name="spoolman"
        :headers="configurableHeaders"
      />

      <v-text-field
        v-model="search"
        outlined
        dense
        single-line
        hide-details
        spellcheck="false"
        append-icon="$magnify"
        style="max-width: 360px"
        class="ml-1"
        @focus="$event.target.select()"
      />
    </v-toolbar>

    <div class="file-system">
      <v-data-table
        :items="availableSpools"
        :headers="headers"
        :search="search"
        :custom-filter="filterResults"
        :no-data-text="$t('app.file_system.msg.not_found')"
        :no-results-text="$t('app.file_system.msg.not_found')"
        :sort-by="sortOrder.key ?? undefined"
        :sort-desc="sortOrder.desc ?? undefined"
        item-key="id"
        mobile-breakpoint="0"
        class="spool-table"
        hide-default-footer
        disable-pagination
        fixed-header
        @update:sort-by="handleSortOrderKeyChange"
        @update:sort-desc="handleSortOrderDescChange"
      >
        <template #item="{ headers, item }">
          <app-data-table-row
            :key="item.id"
            :headers="headers"
            :item="item"
            :is-selected="item.id === selectedSpoolId"
            @click.prevent="selectedSpoolId = selectedSpoolId === item.id ? null : item.id"
          >
            <template #[`item.filament_name`]>
              <div class="d-flex my-1">
                <v-progress-circular
                  :rotate="-90"
                  :size="44"
                  :width="3"
                  :value="item.remaining_weight / item.initial_weight * 100"
                  color="primary"
                  class="mr-4 flex-column"
                >
                  <v-icon
                    :color="getSpoolColor(item)"
                    size="42"
                    class="spool-icon"
                  >
                    {{ item.id === selectedSpoolId ? '$markedCircle' : '$filament' }}
                  </v-icon>
                </v-progress-circular>

                <div class="flex-column">
                  <div class="flex-row">
                    {{ item.filament_name }}
                  </div>
                  <div class="flex-row">
                    <small v-if="remainingFilamentUnit === 'weight'">
                      <b>{{ $filters.getReadableWeightString(item.remaining_weight) }}</b>
                      / {{ $filters.getReadableWeightString(item.initial_weight) }}
                    </small>
                    <small v-else-if="remainingFilamentUnit === 'length'">
                      <b>{{ $filters.getReadableLengthString(item.remaining_length) }}</b>
                      / {{ $filters.getReadableLengthString(item.initial_length) }}
                    </small>
                  </div>
                </div>
              </div>
            </template>

            <template #[`item-value.afc_loaded_lane`]="{ value }">
              <v-chip
                v-if="value != null"
                color="primary"
                small
              >
                {{ $filters.prettyCase(value ?? '') }}
              </v-chip>
            </template>

            <template #[`item-value.initial_weight`]="{ value }">
              {{ $filters.getReadableWeightString(value) }}
            </template>

            <template #[`item-value.used_weight`]="{ value }">
              {{ $filters.getReadableWeightString(value) }}
            </template>

            <template #[`item-value.remaining_weight`]="{ value }">
              {{ $filters.getReadableWeightString(value) }}
            </template>

            <template #[`item-value.initial_length`]="{ value }">
              {{ $filters.getReadableLengthString(value) }}
            </template>

            <template #[`item-value.used_length`]="{ value }">
              {{ $filters.getReadableLengthString(value) }}
            </template>

            <template #[`item-value.remaining_length`]="{ value }">
              {{ $filters.getReadableLengthString(value) }}
            </template>

            <template #[`item-value.price`]="{ value }">
              {{ $filters.getReadableCurrencyString(value, currency ?? '') }}
            </template>

            <template #[`item-value.filament.density`]="{ value }">
              {{ value }} g/cm³
            </template>

            <template #[`item-value.filament.diameter`]="{ value }">
              {{ value }} mm
            </template>

            <template #[`item-value.filament.settings_extruder_temp`]="{ value }">
              {{ value }}<small>°C</small>
            </template>

            <template #[`item-value.filament.settings_bed_temp`]="{ value }">
              {{ value }}<small>°C</small>
            </template>

            <template #[`item.first_used`]="{ value }">
              {{
                value
                  ? $filters.formatRelativeTimeToNow(value)
                  : $tc('app.setting.label.never')
              }}
            </template>

            <template #[`item.last_used`]="{ value }">
              {{
                value
                  ? $filters.formatRelativeTimeToNow(value)
                  : $tc('app.setting.label.never')
              }}
            </template>

            <template #[`item-value.filament.colors`]="{ value }">
              <app-data-table-cell-colors :colors="value" />
            </template>
          </app-data-table-row>
        </template>
      </v-data-table>
    </div>

    <template #actions>
      <v-spacer v-if="isMobileViewport" />

      <app-btn
        v-if="spoolmanURL"
        :href="spoolmanURL"
        target="_blank"
        color="primary"
        text
        type="button"
      >
        {{ $t('app.spoolman.btn.manage_spools') }}
      </app-btn>

      <v-spacer v-if="!isMobileViewport" />

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
        {{
          filename
            ? $t('app.general.btn.print')
            : $tc('app.spoolman.btn.select', targetMacro ? 2 : 1, { macro: targetMacro })
        }}
      </app-btn>
    </template>

    <QRReader
      v-if="cameraScanSource"
      v-model="cameraScanSource"
      @detected="handleQRCodeDetected"
    />
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { SocketActions } from '@/api/socketActions'
import type { Spool } from '@/store/spoolman/types'
import BrowserMixin from '@/mixins/browser'
import QRReader from '@/components/widgets/spoolman/QRReader.vue'
import QrScanner from 'qr-scanner'
import type { AppDataTableHeader } from '@/types'
import getFilePaths from '@/util/get-file-paths'
import type { DataTableHeader } from 'vuetify'
import type { AppFileWithMeta } from '@/store/files/types'
import type { SpoolmanRemainingFilamentUnit } from '@/store/config/types'

type SpoolWithAfcLoadedLane = Spool & {
  afc_loaded_lane?: string
}

@Component({
  components: {
    QRReader
  }
})
export default class SpoolSelectionDialog extends Mixins(StateMixin, BrowserMixin, AfcMixin) {
  search = ''
  selectedSpoolId: number | null = null

  cameraScanSource: null | string = null

  hasDeviceCamera = false

  async mounted () {
    this.hasDeviceCamera = await QrScanner.hasCamera()
  }

  @Watch('open')
  onOpen () {
    if (this.open) {
      if (this.spoolSelectionOnly) {
        this.selectedSpoolId = this.$typedState.spoolman.dialog.selectedSpoolId ?? null
      } else if (this.targetMacro) {
        const macro = this.$typedGetters['macros/getMacroByName'](this.targetMacro)

        this.selectedSpoolId = typeof macro?.variables?.spool_id === 'number'
          ? macro.variables.spool_id
          : null
      } else {
        this.selectedSpoolId = this.$typedState.spoolman.activeSpool
      }

      if (this.currentFileName && this.currentFile == null) {
        SocketActions.serverFilesMetadata(this.currentFileName)
      }

      if (this.hasDeviceCamera && this.preferDeviceCamera) {
        this.$nextTick(() => (this.cameraScanSource = 'device'))
      } else {
        const autoOpenCameraId = this.autoOpenQRDetectionCamera
        if (autoOpenCameraId && this.$typedGetters['webcams/getWebcamById'](autoOpenCameraId)) {
          this.$nextTick(() => (this.cameraScanSource = autoOpenCameraId))
        }
      }
    }
  }

  get open (): boolean {
    return this.$typedState.spoolman.dialog.show
  }

  set open (val: boolean) {
    this.$typedCommit('spoolman/setDialogState', {
      ...this.$typedState.spoolman.dialog,
      show: val
    })
  }

  get availableSpools (): SpoolWithAfcLoadedLane[] {
    const availableSpools: Spool[] = this.$typedGetters['spoolman/getAvailableSpools']

    const afcLoadedSpools = this.afc != null
      ? this.afcLoadedSpools
      : {}

    return availableSpools
      .filter(x => !x.archived)
      .map(spool => ({
        ...spool,
        afc_loaded_lane: afcLoadedSpools[spool.id]
      } satisfies SpoolWithAfcLoadedLane))
  }

  get currency (): string | null {
    return this.$typedState.spoolman.currency
  }

  get configurableHeaders (): AppDataTableHeader[] {
    const afcHeaders: AppDataTableHeader[] = this.afc != null
      ? [
          {
            text: this.$tc('app.afc.LaneLoaded'),
            value: 'afc_loaded_lane',
            cellClass: 'text-no-wrap'
          }
        ]
      : []

    const headers: AppDataTableHeader[] = [
      {
        text: this.$tc('app.spoolman.label.id'),
        value: 'id',
        cellClass: 'text-no-wrap'
      },
      ...afcHeaders,
      {
        text: this.$tc('app.spoolman.label.material'),
        value: 'filament.material',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.initial_weight'),
        value: 'initial_weight',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.used_weight'),
        value: 'used_weight',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.remaining_weight'),
        value: 'remaining_weight',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.initial_length'),
        value: 'initial_length',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.used_length'),
        value: 'used_length',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.remaining_length'),
        value: 'remaining_length',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.price'),
        value: 'price',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.lot_nr'),
        value: 'lot_nr',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.density'),
        value: 'filament.density',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.diameter'),
        value: 'filament.diameter',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.extruder_temp'),
        value: 'filament.settings_extruder_temp',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.bed_temp'),
        value: 'filament.settings_bed_temp',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.colors'),
        value: 'filament.colors',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.location'),
        value: 'location',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.comment'),
        value: 'comment',
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.first_used'),
        value: 'first_used',
        visible: false,
        cellClass: 'text-no-wrap'
      },
      {
        text: this.$tc('app.spoolman.label.last_used'),
        value: 'last_used',
        cellClass: 'text-no-wrap'
      }
    ]

    const mergedTableHeaders: AppDataTableHeader[] = this.$typedGetters['config/getMergedTableHeaders'](headers, 'spoolman')

    return mergedTableHeaders
  }

  get headers (): DataTableHeader[] {
    return [
      {
        text: this.$tc('app.spoolman.label.filament_name'),
        value: 'filament_name'
      },
      ...this.configurableHeaders
        .filter(header => header.visible !== false)
    ]
  }

  get filename (): string | undefined {
    const filename: string | undefined = this.$typedState.spoolman.dialog.filename

    if (filename && filename.startsWith('/')) {
      return filename.slice(1)
    }

    return filename
  }

  get currentFileName (): string {
    return this.filename || this.$typedState.printer.printer.print_stats?.filename || ''
  }

  get currentFile (): AppFileWithMeta | undefined {
    const { filename, rootPath } = getFilePaths(this.currentFileName, 'gcodes')

    return this.$typedGetters['files/getFile'](rootPath, filename)
  }

  get spoolSelectionOnly (): boolean {
    return this.$typedState.spoolman.dialog.spoolSelectionOnly ?? false
  }

  get targetMacro (): string | undefined {
    return this.$typedState.spoolman.dialog.targetMacro
  }

  get enabledWebcams (): Moonraker.Webcam.Entry[] {
    return this.$typedGetters['webcams/getEnabledWebcams']
  }

  get availableCameras (): Pick<Moonraker.Webcam.Entry, 'uid' | 'name'>[] {
    const cameras: Pick<Moonraker.Webcam.Entry, 'uid' | 'name'>[] = this.enabledWebcams
      .filter(camera => camera.service !== 'iframe')

    if (this.hasDeviceCamera) {
      // always show device camera first
      cameras.unshift({
        name: this.$t('app.spoolman.label.device_camera').toString(),
        uid: 'device'
      })
    }

    return cameras
  }

  get remainingFilamentUnit (): SpoolmanRemainingFilamentUnit {
    return this.$typedState.config.uiSettings.spoolman.remainingFilamentUnit
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
    if (this.spoolSelectionOnly) {
      // save selection for parent dialog
      this.$typedCommit('spoolman/setDialogState', {
        show: false,
        selectedSpoolId: this.selectedSpoolId ?? undefined
      })
      return
    }

    if (!this.selectedSpoolId) {
      // no spool selected

      const confirmation = await this.$confirm(
        this.$tc('app.spoolman.msg.no_spool'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
      )

      if (!confirmation) {
        return
      }
    }

    if (this.targetMacro) {
      // no need to run sanity checks or start a print when we target a macro, so we return early

      // set spool_id via SET_GCODE_VARIABLE
      const commands = [
        `SET_GCODE_VARIABLE MACRO=${this.targetMacro} VARIABLE=spool_id VALUE=${this.selectedSpoolId ?? 'None'}`
      ]

      const printerConfig: Klipper.ConfigState = this.$typedGetters['printer/getPrinterConfig']
      const supportsSaveVariables = printerConfig.save_variables
      if (supportsSaveVariables) {
        // persist selected spool across restarts
        commands.push(`SAVE_VARIABLE VARIABLE=${this.targetMacro.toLowerCase()}__spool_id VALUE=${this.selectedSpoolId ?? 'None'}`)
      }

      this.sendGcode(commands.join('\n'))

      const macro = this.$typedGetters['macros/getMacroByName'](this.targetMacro)
      if (macro?.variables?.active) {
        // selected tool is active, update active spool
        await SocketActions.serverSpoolmanPostSpoolId(this.selectedSpoolId ?? undefined)
      }

      this.open = false
      return
    }

    const spool = this.availableSpools.find(spool => spool.id === this.selectedSpoolId)
    if (spool && this.currentFileName && (this.warnOnFilamentTypeMismatch || this.warnOnNotEnoughFilament)) {
      // trigger sanity checks when we have an active file
      // (current print or new print) and sanity checks are enabled.

      if (this.currentFile && (this.filename || !['complete', 'cancelled'].includes(this.printerState))) {
        // if we're tracking a file and starting a new print or the current one hasn't ended yet

        if (this.warnOnFilamentTypeMismatch) {
          const fileMaterials = this.currentFile.filament_type?.map(x => x.toLowerCase())
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

        let requiredLength = this.currentFile?.filament_total
        if (requiredLength && ['printing', 'paused'].includes(this.printerState)) {
          // if we're currently running a print job, subtract the already printed amount from the required length
          requiredLength -= this.$typedState.printer.printer.print_stats?.filament_used ?? 0
          requiredLength = Math.max(requiredLength, 0)
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
        } else if (this.warnOnNotEnoughFilament) {
          if (spool.remaining_length != null && requiredLength >= spool.remaining_length) {
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
    }

    await SocketActions.serverSpoolmanPostSpoolId(this.selectedSpoolId ?? undefined)

    if (this.filename) {
      await SocketActions.printerPrintStart(this.filename)

      if (this.$route.name !== 'home') {
        this.$router.push({ name: 'home' })
      }
    }

    this.open = false
  }

  filterResults (value: string, query: string, item: Spool): boolean {
    query = query.toLowerCase()
    return [item.id, item.comment, item.filament.name, item.filament.material, item.filament.vendor?.name]
      .some(val => val?.toString().toLowerCase().includes(query))
  }

  get spoolmanURL (): string | undefined {
    return this.$typedGetters['spoolman/getSpoolmanUrl']
  }

  get preferDeviceCamera () {
    return this.$typedState.config.uiSettings.spoolman.preferDeviceCamera
  }

  get autoOpenQRDetectionCamera (): string | null {
    return this.$typedState.config.uiSettings.spoolman.autoOpenQRDetectionCamera
  }

  get autoSelectSpoolOnMatch (): boolean {
    return this.$typedState.config.uiSettings.spoolman.autoSelectSpoolOnMatch
  }

  get warnOnNotEnoughFilament (): boolean {
    return this.$typedState.config.uiSettings.spoolman.warnOnNotEnoughFilament
  }

  get warnOnFilamentTypeMismatch (): boolean {
    return this.$typedState.config.uiSettings.spoolman.warnOnFilamentTypeMismatch
  }

  get sortOrder () {
    return this.$typedState.config.uiSettings.spoolman.selectionDialogSortOrder
  }

  handleSortOrderKeyChange (value?: string) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.selectionDialogSortOrder.key',
      value: value ?? null,
      server: true
    })
  }

  handleSortOrderDescChange (value?: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.spoolman.selectionDialogSortOrder.desc',
      value: value ?? null,
      server: true
    })
  }

  getSpoolColor (spool?: Spool) {
    return spool?.filament.color_hex ?? (this.$vuetify.theme.dark ? '#fff' : '#000')
  }
}
</script>

<style lang="scss" scoped>
  .file-system,
  .file-system :deep(.v-data-table) {
    display: flex;
    flex-direction: column;
    overflow: auto;
    height: 100%;
  }
</style>
