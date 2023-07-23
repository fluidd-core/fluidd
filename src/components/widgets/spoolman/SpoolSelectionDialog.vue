<template>
  <div>
    <v-dialog
      v-model="open"
      no-actions
      :max-width="isMobileViewport ? '90vw' : '75vw'"
    >
      <v-card>
        <!-- TODO show file info? -->

        <v-toolbar
          dense
          class="mb-2"
        >
          <v-toolbar-title>
            <v-icon>$changeFilament</v-icon>
            {{ $tc('app.spoolman.title.spool_selection') }}
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

        <v-data-table
          :items="availableSpools"
          :headers="headers"
          :search="search"
          :custom-filter="filterResults"
          :no-data-text="$t('app.file_system.msg.not_found')"
          :no-results-text="$t('app.file_system.msg.not_found')"
          sort-by="last_used"
          sort-desc
          mobile-breakpoint="0"
          class="file-system spool-table"
          hide-default-footer
          disable-pagination
        >
          <template #item="{ item }">
            <tr
              :class="{ 'v-data-table__selected': (item.id === selectedSpool) }"
              class="row-select px-1"
              @click.prevent="selectedSpool = item.id"
            >
              <td>
                <div class="d-flex">
                  <v-icon
                    :color="`#${item.filament.color_hex}`"
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
                        <b>{{ Math.floor(item.remaining_weight).toLocaleString() }}g</b> / {{ item.filament.weight.toLocaleString() }}g
                      </small>
                    </div>
                  </div>
                </div>
              </td>
              <td>{{ item.location }}</td>
              <td>{{ item.comment }}</td>
              <td>{{ item.last_used ? $filters.formatRelativeTimeToNow(item.last_used) : $tc('app.setting.label.never') }}</td>
            </tr>
          </template>
        </v-data-table>

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
            {{ filename ? $t('app.general.btn.print') : $t('app.spoolman.btn.select') }}
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
import { Spool } from '@/store/spoolman/types'
import BrowserMixin from '@/mixins/browser'
import QRReader from '@/components/widgets/spoolman/QRReader.vue'
import { CameraConfig } from '@/store/cameras/types'

@Component({
  components: { QRReader }
})
export default class SpoolSelectionDialog extends Mixins(StateMixin, BrowserMixin) {
  search = ''
  selectedSpoolId = this.$store.state.spoolman.activeSpool ?? null

  cameraScanSource: null | string = null
  cameraSelectionMenuOpen = false

  @Watch('open')
  onOpen () {
    if (this.open && this.currentFileName) {
      // prefetch file metadata
      SocketActions.serverFilesMetadata(this.currentFileName)
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

      spools.push({
        ...spool,
        filament_name: `${spool.filament.vendor.name} - ${spool.filament.name}`,
        filament_material: spool.filament.material
      })
    }

    return spools
  }

  get headers () {
    return [
      'filament_name',
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

  set selectedSpool (id: number) {
    if (this.selectedSpoolId === id) {
      this.selectedSpoolId = undefined
    } else {
      this.selectedSpoolId = id
    }
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
    return this.$store.getters['files/getFile'](null, filepath ? `gcodes/${filepath}` : 'gcodes', filename)
  }

  get cameras () {
    return this.$store.getters['cameras/getEnabledCameras']
      .filter((camera: CameraConfig) => camera.service !== 'iframe')
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
    if (spool && this.filename) {
      // check for enough filament

      let remainingLength = spool.remaining_length
      if (!remainingLength) {
        // l[mm] = m[g]/D[g/cm³]/A[mm²]*(1000mm³/cm³)
        remainingLength = spool.remaining_weight / spool.filament.density / (Math.PI * (spool.filament.diameter / 2) ** 2) * 1000
      }

      // l[mm]
      let requiredLength = 0
      if (this.currentFile) {
        if (this.currentFile.filament_type !== spool.filament.material) {
          // filament materials don't match

          const confirmation = await this.$confirm(
            this.$tc('app.spoolman.msg.mismatched_filament'),
            { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$warning' }
          )

          if (!confirmation) {
            return
          }
        }

        requiredLength = this.currentFile?.filament_total ?? 0
        // subtract already printed length
        requiredLength -= this.$store.state.printer.printer.print_stats?.filament_used ?? 0
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
      }

      if (requiredLength >= remainingLength) {
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

    await SocketActions.spoolmanSetSpool(this.selectedSpool)
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
    return [item.comment, item.filament.name, item.filament.material, item.filament.vendor.name]
      .some(val => val?.toLowerCase().includes(query))
  }

  get spoolmanURL () {
    return this.$store.state.server.config.spoolman?.server
  }
}
</script>

<style lang="scss" scoped>
  .spool-table tr td {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
  }
</style>
