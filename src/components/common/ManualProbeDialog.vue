<template>
  <app-dialog
    v-model="open"
    :title="$t('app.tool.title.manual_probe')"
    :cancel-button-text="$t('app.general.btn.abort')"
    :save-button-text="$t('app.general.btn.accept')"
    :save-button-loading="hasWait($waits.onManualProbe)"
    max-width="450"
    @cancel="sendAbort"
    @save="sendAccept"
  >
    <v-card-text>
      <v-row>
        <v-col>
          <v-text-field
            label="Z Min"
            outlined
            persistent-placeholder
            hide-details
            dense
            disabled
            :value="zPositionLower"
          />
        </v-col>
        <v-col>
          <v-text-field
            label="Z"
            outlined
            persistent-placeholder
            hide-details
            dense
            disabled
            :value="zPosition"
          />
        </v-col>
        <v-col>
          <v-text-field
            label="Z Max"
            outlined
            persistent-placeholder
            hide-details
            dense
            disabled
            :value="zPositionUpper"
          />
        </v-col>
      </v-row>

      <v-row class="bysect-row">
        <v-col
          cols="3"
          offset="1"
        >
          <app-btn-group class="d-flex">
            <app-btn
              :disabled="!klippyReady || printerPrinting"
              color="primary"
              @click="sendTestZ('--')"
            >
              --
            </app-btn>
            <app-btn
              :disabled="!klippyReady || printerPrinting"
              color="primary"
              @click="sendTestZ('-')"
            >
              -
            </app-btn>
          </app-btn-group>
        </v-col>
        <v-col
          cols="3"
          offset="4"
        >
          <app-btn-group class="d-flex">
            <app-btn
              :disabled="!klippyReady || printerPrinting"
              color="primary"
              @click="sendTestZ('+')"
            >
              +
            </app-btn>
            <app-btn
              :disabled="!klippyReady || printerPrinting"
              color="primary"
              @click="sendTestZ('++')"
            >
              ++
            </app-btn>
          </app-btn-group>
        </v-col>
      </v-row>

      <v-row
        v-for="offset in offsets"
        :key="offset"
        class="offset-row"
      >
        <v-col
          cols="3"
          offset="1"
        >
          <app-btn
            :disabled="!klippyReady || printerPrinting"
            color="primary"
            @click="sendTestZ(`-${offset}`)"
          >
            <v-icon>
              $minus
            </v-icon>
          </app-btn>
        </v-col>
        <v-col cols="4">
          <div
            class="v-btn v-size--default btncolor"
          >
            {{ offset }}
          </div>
        </v-col>
        <v-col cols="3">
          <app-btn
            :disabled="!klippyReady || printerPrinting"
            color="primary"
            @click="sendTestZ(`+${offset}`)"
          >
            <v-icon>
              $plus
            </v-icon>
          </app-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, VModel, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({})
export default class ManualProbeDialog extends Mixins(StateMixin, ToolheadMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  get offsets () {
    return [
      1,
      0.1,
      ...this.$store.state.config.uiSettings.general.zAdjustDistances
    ].sort((a, b) => b - a)
  }

  get manualProbe () {
    return this.$store.state.printer.printer.manual_probe
  }

  get zPositionLower () {
    return this.manualProbe.z_position_lower?.toFixed(3)
  }

  get zPosition () {
    return this.manualProbe.z_position?.toFixed(3)
  }

  get zPositionUpper () {
    return this.manualProbe.z_position_upper?.toFixed(3)
  }

  @Watch('isManualProbeActive')
  onIsManualProbeActive (value: boolean) {
    if (!value) {
      this.open = false
    }
  }

  sendTestZ (zValue: string) {
    this.sendGcode(`TESTZ Z=${zValue}`)
  }

  sendAbort () {
    this.sendGcode('ABORT', this.$waits.onManualProbe)
    this.open = false
  }

  sendAccept () {
    this.sendGcode('ACCEPT', this.$waits.onManualProbe)
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  .bysect-row > .col {
    padding: 4px 1px;

    & .v-btn {
      min-width: 40px;
      flex-grow: 1;
    }
  }

  .offset-row > .col {
    padding: 4px 1px;

    & > * {
      border-radius: 0;
      width: 100%;
    }

    &:first-child > * {
      border-radius: $border-radius-root 0 0 $border-radius-root;
    }
    &:last-child > * {
      border-radius: 0 $border-radius-root $border-radius-root 0;
    }
  }
</style>
