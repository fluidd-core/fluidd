<template>
  <app-dialog
    v-model="open"
    :title="$tc('app.spoolman.title.spool_selection')"
    no-actions
  >
    a b c d
    <!-- TODO show file info? -->

    <v-divider />

    <v-data-table
      :items="availableSpools"
      :headers="headers"
      :search="search"
      :no-data-text="$t('app.file_system.msg.not_found')"
      :no-results-text="$t('app.file_system.msg.not_found')"
      mobile-breakpoint="0"
      sort-by="last_used"
      class="file-system"
    >
      <template #item="{ item }">
        <tr
          :class="{
            'v-data-table__selected': (item.id === selectedSpool)
          }"
          class="row-select px-1"
          @click.prevent="selectedSpool = item.id"
        >
          <td>{{ item.filament.vendor.name }} - {{ item.filament.name }}</td>
          <td>{{ item.used_weight.toLocaleString() }}</td>
          <td>{{ item.remaining_weight.toLocaleString() }}</td>
          <td>{{ item.location }}</td>
          <td>{{ item.lot_nr }}</td>
          <td>{{ item.first_used ? $filters.formatRelativeTimeToNow(item.first_used) : $tc('app.setting.label.never') }}</td>
          <td>{{ item.last_used ? $filters.formatRelativeTimeToNow(item.last_used) : $tc('app.setting.label.never') }}</td>
          <td>{{ item.comment }}</td>
        </tr>
      </template>
    </v-data-table>

    <v-divider />

    <v-card-actions class="pt-4">
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
          $printer
        </v-icon>
        {{ $t('app.general.btn.print') }}
      </app-btn>
    </v-card-actions>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileRowItem from '@/components/widgets/filesystem/FileRowItem.vue'
import { SocketActions } from '@/api/socketActions'
import { Spool } from '@/store/spoolman/types'

@Component({
  components: { FileRowItem }
})
export default class SpoolSelectionDialog extends Mixins(StateMixin) {
  search = ''
  selectedSpoolId = this.$store.state.spoolman.activeSpool ?? null

  @Watch('open')
  onOpen () {
    if (this.open) {
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
    return this.$store.state.spoolman.availableSpools
  }

  get headers () {
    return [
      'filament',
      'used_weight',
      'remaining_weight',
      'location',
      'lot_nr',
      'first_used',
      'last_used',
      'comment'
    ].map(value => ({
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
    if (filename.startsWith('/')) {
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
    await SocketActions.printerPrintStart(this.$store.state.spoolman.dialog.filename)
    this.open = false
  }
}
</script>
