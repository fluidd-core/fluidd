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
          <td>{{ item.filament }}</td>
          <td>{{ item.used_weight }}</td>
          <td>{{ item.remaining_weight }}</td>
          <td>{{ item.location }}</td>
          <td>{{ item.lot_nr }}</td>
          <td>{{ item.first_used }}</td>
          <td>{{ item.last_used }}</td>
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
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileRowItem from '@/components/widgets/filesystem/FileRowItem.vue'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: { FileRowItem }
})
export default class FilePreviewDialog extends Mixins(StateMixin) {
  search = ''
  selectedSpoolId = this.$store.state.spoolman.activeSpool

  get open () {
    return this.$store.state.spoolman.dialog.show
  }

  set open (val: boolean) {
    this.$store.commit('spoolman/setDialogState', {
      show: val,
      filename: ''
    })
  }

  get availableSpools () {
    const spools = []
    for (const spool of this.$store.state.spoolman.availableSpools) {
      spools.push({
        ...spool,
        used_weight: `${spool.used_weight.toLocaleString()} g`,
        remaining_weight: `${spool.remaining_weight.toLocaleString()} g`,
        filament: `${spool.filament.vendor.name} - ${spool.filament.name}`,
        first_used: spool.first_used ? this.$filters.formatRelativeTimeToNow(spool.first_used) : this.$tc('app.setting.label.never'),
        last_used: spool.last_used ? this.$filters.formatRelativeTimeToNow(spool.last_used) : this.$tc('app.setting.label.never')
      })
    }

    return spools
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

  async handleSelectSpool () {
    if (!this.selectedSpool) {
      if (!await this.$confirm(
        this.$tc('app.spoolman.msg.no_spool'),
        { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
      )) {
        return
      }
    }

    await SocketActions.spoolmanSetSpool(this.selectedSpool)
    await SocketActions.printerPrintStart(this.$store.state.spoolman.dialog.filename)
    this.open = false
  }
}
</script>
