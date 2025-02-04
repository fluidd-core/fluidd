<template>
  <app-dialog
    v-model="bedScrewsAdjustDialogOpen"
    :title="$t('app.tool.title.bed_screws_adjust')"
    max-width="450"
    @save="sendAccept"
  >
    <v-card-text>
      <v-row>
        <v-col>
          <v-text-field
            :label="$t('app.general.label.screw_name')"
            outlined
            persistent-placeholder
            hide-details
            dense
            disabled
            :value="currentScrewName"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-text-field
            :label="$t('app.general.label.screw_index')"
            outlined
            persistent-placeholder
            hide-details
            dense
            disabled
            :value="$t('app.general.label.partial_of_total', {partial: currentScrewIndex + 1, total: totalScrews})"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col>
          <v-text-field
            :label="$t('app.general.label.accepted_screws')"
            outlined
            persistent-placeholder
            hide-details
            dense
            disabled
            :value="$t('app.general.label.partial_of_total', {partial: acceptedScrews, total: totalScrews})"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col class="text-subtitle-1 text-center">
          <span v-html="$t('app.general.msg.bed_screws_adjust')" />
        </v-col>
      </v-row>

      <v-progress-linear
        :value="acceptedScrews / totalScrews * 100"
        class="mt-2"
      />
    </v-card-text>

    <template #actions>
      <v-spacer />

      <app-btn
        color="warning"
        text
        type="button"
        @click="sendAbort"
      >
        {{ $t('app.general.btn.abort') }}
      </app-btn>

      <app-btn
        :loading="hasWait($waits.onBedScrewsAdjust)"
        color="primary"
        text
        type="button"
        @click="sendAdjusted"
      >
        {{ $t('app.general.btn.adjusted') }}
      </app-btn>

      <app-btn
        :loading="hasWait($waits.onBedScrewsAdjust)"
        color="primary"
        type="submit"
      >
        {{ $t('app.general.btn.accept') }}
      </app-btn>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import type { BedScrews } from '@/store/printer/types'

@Component({})
export default class BedScrewsAdjustDialog extends Mixins(StateMixin, ToolheadMixin) {
  get bedScrews (): BedScrews {
    return this.$store.getters['printer/getBedScrews']
  }

  get currentScrewIndex () {
    return this.bedScrews.current_screw ?? 0
  }

  get currentScrewName () {
    return this.bedScrews.screws[this.currentScrewIndex]?.prettyName
  }

  get acceptedScrews () {
    return this.bedScrews.accepted_screws ?? 0
  }

  get totalScrews () {
    return this.bedScrews.screws.length
  }

  get showBedScrewsAdjustDialogAutomatically (): boolean {
    return this.$store.state.config.uiSettings.general.showBedScrewsAdjustDialogAutomatically
  }

  @Watch('isBedScrewsAdjustActive')
  onBedScrewsAdjustActive (value: boolean) {
    if (
      !value ||
      (
        this.showBedScrewsAdjustDialogAutomatically &&
        this.klippyReady &&
        !this.printerPrinting
      )
    ) {
      this.bedScrewsAdjustDialogOpen = value
    }
  }

  sendAbort () {
    this.sendGcode('ABORT', this.$waits.onBedScrewsAdjust)
    this.bedScrewsAdjustDialogOpen = false
  }

  sendAdjusted () {
    this.sendGcode('ADJUSTED', this.$waits.onBedScrewsAdjust)
  }

  sendAccept () {
    this.sendGcode('ACCEPT', this.$waits.onBedScrewsAdjust)
  }
}
</script>
