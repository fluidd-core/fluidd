<template>
  <v-dialog
    v-model="open"
    no-actions
  >
    <v-card>
      <!-- TODO show file info? -->

      <v-toolbar
        dense
        class="mb-2"
      >
        <v-toolbar-title>
          <v-icon>$loadFilament</v-icon>
          {{ $tc('app.spoolman.title.spool_selection') }}
        </v-toolbar-title>

        <v-spacer />

        <app-btn
          v-if="spoolmanURL"
          :href="spoolmanURL"
          target="_blank"
          class="mr-2"
        >
          <v-icon
            small
            class="mr-2"
          >
            $edit
          </v-icon>
          {{ isMobileViewport ? '' : $tc('app.spoolman.btn.manage_spools') }}
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
        :height="isMobileViewport ? '75vh' : '50vh'"
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
                  class="mr-2"
                >
                  {{ item.id === selectedSpool ? '$markedCircle' : '$circle' }}
                </v-icon>
                {{ item.filament_name }}
              </div>
            </td>
            <td>{{ item.remaining_weight.toLocaleString() }} / {{ item.filament.weight.toLocaleString() }} g</td>
            <td>{{ item.location }}</td>
            <td>{{ item.lot_nr }}</td>
            <td>{{ item.first_used ? $filters.formatRelativeTimeToNow(item.first_used) : $tc('app.setting.label.never') }}</td>
            <td>{{ item.last_used ? $filters.formatRelativeTimeToNow(item.last_used) : $tc('app.setting.label.never') }}</td>
            <td>{{ item.comment }}</td>
          </tr>
        </template>
      </v-data-table>

      <v-divider />
      <v-spacer />

      <v-card-actions
        class="pt-4"
      >
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
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import { Spool } from '@/store/spoolman/types'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class SpoolSelectionDialog extends Mixins(StateMixin, BrowserMixin) {
  search = ''
  selectedSpoolId = this.$store.state.spoolman.activeSpool ?? null

  @Watch('open')
  onOpen () {
    if (this.open && this.filename) {
      // prefetch file metadata
      SocketActions.serverFilesMetadata(this.filename)
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
      'remaining_weight',
      'location',
      'lot_nr',
      'first_used',
      'last_used',
      'comment'
    ].map(value => ({
      text: value && this.$tc(`app.spoolman.label.${value}`),
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
    if (spool) {
      // check for enough filament

      let remainingLength = spool.remaining_length
      if (!remainingLength) {
        // l = m/D/A
        remainingLength = spool.remaining_weight / spool.filament.density / (Math.PI * (spool.filament.diameter / 2) ** 2)
      }

      const splitFilepath = this.filename.split('/')
      const filename = splitFilepath.pop()
      const filepath = splitFilepath.join('/')
      const requiredLength = this.$store.getters['files/getFile'](null, filepath ? `gcodes/${filepath}` : 'gcodes', filename)?.filament_total
      console.log({ remainingLength, requiredLength })

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
    }
    this.open = false
  }

  filterResults (value: string, query: string, item: Spool): boolean {
    query = query.toLowerCase()
    return item.comment?.toLowerCase().includes(query) ||
      item.filament.name.toLowerCase().includes(query) ||
      item.filament.material.toLowerCase().includes(query) ||
      item.filament.vendor.name.toLowerCase().includes(query)
  }

  get spoolmanURL () {
    return this.$store.state.server.config.spoolman?.server
  }
}
</script>
