<template>
  <app-dialog
    v-model="open"
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
            :value="$t('app.general.label.partial_of_total', {partial: currentScrewIndex + 1, total: bedScrews.length})"
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
            :value="$t('app.general.label.partial_of_total', {partial: acceptedScrews, total: bedScrews.length})"
          />
        </v-col>
      </v-row>
      <v-row>
        <v-col class="text-subtitle-1 text-center">
          <span v-html="$t('app.general.msg.bed_screws_adjust')" />
        </v-col>
      </v-row>

      <v-progress-linear
        :value="acceptedScrews / bedScrews.length * 100"
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
import { Component, Mixins, VModel, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import type { BedScrews } from '@/store/printer/types'

@Component({})
export default class BedScrewsAdjustDialog extends Mixins(StateMixin, ToolheadMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  get bedScrews (): BedScrews[] {
    return this.$store.getters['printer/getBedScrews'] as BedScrews[]
  }

  get bedScrewsAdjust () {
    return this.$store.state.printer.printer.bed_screws
  }

  get currentState () {
    return this.bedScrewsAdjust.state
  }

  get currentScrewIndex () {
    return this.bedScrewsAdjust.current_screw
  }

  get currentScrewName () {
    return this.bedScrews[this.currentScrewIndex].prettyName
  }

  get acceptedScrews () {
    return this.bedScrewsAdjust.accepted_screws
  }

  @Watch('isBedScrewsAdjustActive')
  onBedScrewsAdjustActive (value: boolean) {
    if (!value) {
      this.open = false
    }
  }

  sendAbort () {
    this.sendGcode('ABORT', this.$waits.onBedScrewsAdjust)
    this.open = false
  }

  sendAdjusted () {
    this.sendGcode('ADJUSTED', this.$waits.onBedScrewsAdjust)
  }

  sendAccept () {
    this.sendGcode('ACCEPT', this.$waits.onBedScrewsAdjust)
  }
}
</script>
