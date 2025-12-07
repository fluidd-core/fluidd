<template>
  <v-menu
    :offset-y="true"
    :close-on-content-click="false"
    :title="$t('app.afc.Functions')"
    left
  >
    <template #activator="{ on, attrs }">
      <app-btn
        icon
        v-bind="attrs"
        v-on="on"
      >
        <v-icon dense>
          $menu
        </v-icon>
      </app-btn>
    </template>
    <v-list dense>
      <v-list-item
        v-for="command in commands"
        :key="command.command"
      >
        <v-tooltip
          top
          :disabled="command.toolTipDisabled"
        >
          <template #activator="{ on, attrs }">
            <v-btn
              class="w-100"
              :disabled="(command.disabledWhilePrinting && printerPrinting) || !klippyReady"
              small
              v-bind="attrs"
              v-on="on"
              @click="sendGcode(command.command)"
            >
              <v-icon
                v-if="command.icon"
                small
                left
              >
                {{ command.icon }}
              </v-icon>
              {{ command.text }}
            </v-btn>
          </template>
          <span>
            {{ macroDescription(command.command) }}
          </span>
        </v-tooltip>
      </v-list-item>
      <v-list-item
        v-for="macro in macros"
        :key="macro.macroName"
      >
        <v-tooltip
          top
          :disabled="macro.toolTipDisabled"
        >
          <template #activator="{ on, attrs }">
            <macro-btn
              v-bind="attrs"
              :macro="macro.macro"
              small
              class="w-100"
              v-on="on"
              @click="sendGcode($event)"
            >
              {{ macro.text }}
            </macro-btn>
          </template>
          <span>
            {{ macroDescription(macro.macroName) }}
          </span>
        </v-tooltip>
      </v-list-item>
      <v-list-item>
        <v-btn
          class="w-100"
          small
          @click="showAfcSettings = true"
        >
          <v-icon
            small
            left
          >
            $afcSettings
          </v-icon>
          {{ $t('app.afc.AfcSettings') }}
        </v-btn>
        <afc-settings-dialog
          v-model="showAfcSettings"
          @cancel="showAfcSettings = false"
        />
      </v-list-item>
      <v-list-item>
        <v-btn
          class="w-100"
          small
          @click="downloadDebugJson"
        >
          <v-icon
            small
            left
          >
            $afcDebugJson
          </v-icon>
          {{ $t('app.afc.DebugJson') }}
        </v-btn>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import MacroBtn from '@/components/widgets/macros/MacroBtn.vue'
import AfcSettingsDialog from '@/components/widgets/afc/dialogs/AfcSettingsDialog.vue'
import type { GcodeCommands, KlipperPrinterAfcSettings, KlipperPrinterConfig, KlipperPrinterSettings, KlipperPrinterState } from '@/store/printer/types'
import downloadUrl from '@/util/download-url'

@Component({
  components: {
    AfcSettingsDialog,
    MacroBtn
  }
})
export default class AfcCardButtons extends Mixins(StateMixin, AfcMixin) {
  showAfcSettings = false

  get printerSettings (): KlipperPrinterSettings {
    return this.$typedGetters['printer/getPrinterSettings']
  }

  get printerConfig (): KlipperPrinterConfig {
    return this.$typedGetters['printer/getPrinterConfig']
  }

  get availableCommands (): GcodeCommands {
    return this.$typedGetters['printer/getAvailableCommands']
  }

  get commands () {
    const availableCommands = this.availableCommands

    const buttons = [
      {
        icon: '$afcCalibration',
        text: this.$t('app.afc.Calibrate'),
        command: 'AFC_CALIBRATION',
        disabled: false,
        toolTipDisabled: this.macroTooltipDisabled('AFC_CALIBRATION'),
        disabledWhilePrinting: true,
      },
    ]

    if (this.afc?.led_state === true) {
      buttons.push({
        icon: '$afcTurnOffLed',
        text: this.$t('app.afc.LedOff'),
        command: 'TURN_OFF_AFC_LED',
        disabled: false,
        toolTipDisabled: this.macroTooltipDisabled('TURN_OFF_AFC_LED'),
        disabledWhilePrinting: false,
      })
    } else {
      buttons.push({
        icon: '$afcTurnOnLed',
        text: this.$t('app.afc.LedOn'),
        command: 'TURN_ON_AFC_LED',
        disabled: false,
        toolTipDisabled: this.macroTooltipDisabled('TURN_ON_AFC_LED'),
        disabledWhilePrinting: false,
      })
    }

    if (this.afc?.td1_present === true) {
      buttons.push({
        icon: '',
        text: 'Capture TD',
        command: 'AFC_GET_TD_ONE_DATA',
        disabled: false,
        toolTipDisabled: this.macroTooltipDisabled('AFC_GET_TD_ONE_DATA'),
        disabledWhilePrinting: true,
      })
    }

    return buttons
      .filter(button => button.command.toUpperCase() in availableCommands)
  }

  macroTooltipDisabled (macroName: string): boolean {
    return !this.macroDescription(macroName)
  }

  macroDescription (macroName: string) {
    const macro = this.$typedGetters['macros/getMacroByName'](macroName)

    return macro?.description || ''
  }

  get macros () {
    const settings: KlipperPrinterAfcSettings | undefined = this.printerSettings.afc

    const afcMacros = []

    if (settings?.wipe) {
      const wipe_name: string = settings.wipe_cmd || 'AFC_BRUSH'

      afcMacros.push({
        text: this.$t('app.afc.BrushNozzle'),
        macroName: wipe_name,
        disabled: this.printerPrinting,
        toolTipDisabled: this.macroTooltipDisabled(wipe_name),
      })
    }

    if (settings?.park) {
      const park_name: string = settings.park_cmd || 'AFC_PARK'

      afcMacros.push({
        text: this.$t('app.afc.ParkNozzle'),
        macroName: park_name,
        disabled: this.printerPrinting,
        toolTipDisabled: this.macroTooltipDisabled(park_name),
      })
    }

    return afcMacros
      .map(button => ({
        ...button,
        macro: this.$typedGetters['macros/getMacroByName'](button.macroName),
      }))
      .filter((button) => button.macro != null)
  }

  downloadDebugJson () {
    const printer: KlipperPrinterState = this.$typedState.printer.printer

    const output = {
      config: Object.fromEntries(
        Object.entries(this.printerConfig)
          .filter(([key]) => /^afc(?:$|_)/.test(key))
      ),
      settings: Object.fromEntries(
        Object.entries(this.printerSettings)
          .filter(([key]) => /^afc(?:$|_)/.test(key))
      ),
      printer: Object.fromEntries(
        Object.entries(printer)
          .filter(([key]) => /^afc(?:$|_)/.test(key))
      ),
    }

    const jsonString = JSON.stringify(output)
    const url = `data:text/plain;charset=utf-8,${encodeURIComponent(jsonString)}`

    downloadUrl('afc_debug.json', url)
  }
}
</script>
