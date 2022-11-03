<template>
  <v-dialog
    :value="value"
    :max-width="450"
    scrollable
    @input="$emit('input', $event)"
  >
    <v-form @submit.prevent="sendAccept">
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ $t('app.tool.title.manual_probe') }}</span>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-row>
            <v-col>
              <v-text-field
                label="Z Min"
                outlined
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
              <app-btn-group>
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
              <app-btn-group>
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

        <v-card-actions>
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
            :loading="hasWait($waits.onManualProbe)"
            color="primary"
            type="submit"
          >
            {{ $t('app.general.btn.accept') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({})
export default class ManualProbeDialog extends Mixins(StateMixin, ToolheadMixin) {
  @Prop({ type: Boolean, default: false })
  readonly value!: boolean

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
    return this.manualProbe.z_position_lower?.toFixed(3) || ' '
  }

  get zPosition () {
    return this.manualProbe.z_position?.toFixed(3) || ' '
  }

  get zPositionUpper () {
    return this.manualProbe.z_position_upper?.toFixed(3) || ' '
  }

  @Watch('isManualProbeActive')
  onIsManualProbeActive (value: boolean) {
    if (!value) {
      this.$emit('input', false)
    }
  }

  sendTestZ (zValue: string) {
    this.sendGcode(`TESTZ Z=${zValue}`)
  }

  sendAbort () {
    this.sendGcode('ABORT', this.$waits.onManualProbe)
    this.$emit('input', false)
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
