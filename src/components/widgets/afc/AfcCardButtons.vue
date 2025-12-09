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
          :disabled="!command.description"
        >
          <template #activator="{ on, attrs }">
            <app-btn
              class="fill-width"
              :disabled="!klippyReady || command.disabled"
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
            </app-btn>
          </template>
          <span>
            {{ command.description }}
          </span>
        </v-tooltip>
      </v-list-item>
      <v-list-item
        v-for="macro in macros"
        :key="macro.macroName"
      >
        <v-tooltip
          top
          :disabled="!macro.macro.description"
        >
          <template #activator="{ on, attrs }">
            <macro-btn
              v-bind="attrs"
              :macro="macro.macro"
              small
              class="fill-width"
              v-on="on"
              @click="sendGcode($event)"
            >
              {{ macro.text }}
            </macro-btn>
          </template>
          <span>
            {{ macro.macro.description }}
          </span>
        </v-tooltip>
      </v-list-item>
      <v-list-item>
        <app-btn
          class="fill-width"
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
        </app-btn>
        <afc-settings-dialog v-model="showAfcSettings" />
      </v-list-item>
      <v-list-item>
        <app-btn
          class="fill-width"
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
        </app-btn>
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
import type { Macro } from '@/store/macros/types'

type AfcCommand = {
  icon: string,
  text: string,
  command: string,
  description?: string,
  disabled?: boolean
}

type AfcMacro = {
  text: string,
  macroName: string,
  macro: Macro,
  disabled?: boolean
}

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

    const commands: AfcCommand[] = []

    if ('AFC_CALIBRATION' in availableCommands) {
      commands.push({
        icon: '$afcCalibration',
        text: this.$t('app.afc.Calibrate').toString(),
        command: 'AFC_CALIBRATION',
        description: availableCommands['AFC_CALIBRATION'].help,
        disabled: this.printerPrinting
      })
    }

    if (this.afc?.led_state === true) {
      if ('TURN_OFF_AFC_LED' in availableCommands) {
        commands.push({
          icon: '$afcTurnOffLed',
          text: this.$t('app.afc.LedOff').toString(),
          command: 'TURN_OFF_AFC_LED',
          description: availableCommands['TURN_OFF_AFC_LED'].help
        })
      }
    } else {
      if ('TURN_ON_AFC_LED' in availableCommands) {
        commands.push({
          icon: '$afcTurnOnLed',
          text: this.$t('app.afc.LedOn').toString(),
          command: 'TURN_ON_AFC_LED',
          description: availableCommands['TURN_ON_AFC_LED'].help
        })
      }
    }

    if (
      this.afc?.td1_present === true &&
      'AFC_GET_TD_ONE_DATA' in availableCommands
    ) {
      commands.push({
        icon: '',
        text: this.$t('app.afc.CaptureTd').toString(),
        command: 'AFC_GET_TD_ONE_DATA',
        description: availableCommands['AFC_GET_TD_ONE_DATA'].help,
        disabled: this.printerPrinting
      })
    }

    return commands
  }

  get macros () {
    const settings: KlipperPrinterAfcSettings | undefined = this.printerSettings.afc

    const afcMacros: AfcMacro[] = []

    if (settings?.wipe) {
      const macroName: string = settings.wipe_cmd || 'AFC_BRUSH'
      const macro: Macro | undefined = this.$typedGetters['macros/getMacroByName'](macroName)

      if (macro != null) {
        afcMacros.push({
          text: this.$t('app.afc.BrushNozzle').toString(),
          macroName,
          macro,
          disabled: this.printerPrinting
        })
      }
    }

    if (settings?.park) {
      const macroName: string = settings.park_cmd || 'AFC_PARK'
      const macro: Macro | undefined = this.$typedGetters['macros/getMacroByName'](macroName)

      if (macro != null) {
        afcMacros.push({
          text: this.$t('app.afc.ParkNozzle').toString(),
          macroName,
          macro,
          disabled: this.printerPrinting
        })
      }
    }

    return afcMacros
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
