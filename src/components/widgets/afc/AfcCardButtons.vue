<template>
  <v-menu
    :offset-y="true"
    :close-on-content-click="false"
    :title="$t('app.afc.Functions')"
    left
  >
    <template #activator="{ on, attrs }">
      <v-btn
        icon
        tile
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          $menu
        </v-icon>
      </v-btn>
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
              color=" "
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
            {{ mdiVariable }}
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
            {{ mdiArrowDownBold }}
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
import type { Macro } from '@/store/macros/types'
import MacroBtn from '@/components/widgets/macros/MacroBtn.vue'
import AfcSettingsDialog from '@/components/widgets/afc/dialogs/AfcSettingsDialog.vue'
import {
  mdiArrowDownBold,
  mdiLightbulbOnOutline,
  mdiLightbulbOutline,
  mdiVariable,
  mdiWrench,
} from '@mdi/js'

@Component({
  components: {
    AfcSettingsDialog,
    MacroBtn
  }
})
export default class AfcCardButtons extends Mixins(StateMixin, AfcMixin) {
  mdiArrowDownBold = mdiArrowDownBold
  mdiVariable = mdiVariable

  showAfcSettings = false

  get commands () {
    const commands = this.$typedState.printer.printer.gcode?.commands ?? {}
    const commandsList = Object.keys(commands)

    const buttons = [
      {
        icon: mdiWrench,
        text: this.$t('app.afc.Calibrate'),
        command: 'AFC_CALIBRATION',
        disabled: false,
        toolTipDisabled: this.macroDisabled('AFC_CALIBRATION'),
        disabledWhilePrinting: true,
      },
    ]

    const ledState = this.afc.led_state ?? false
    if (ledState) {
      buttons.push({
        icon: mdiLightbulbOnOutline,
        text: this.$t('app.afc.LedOff'),
        command: 'TURN_OFF_AFC_LED',
        disabled: false,
        toolTipDisabled: this.macroDisabled('TURN_OFF_AFC_LED'),
        disabledWhilePrinting: false,
      })
    } else {
      buttons.push({
        icon: mdiLightbulbOutline,
        text: this.$t('app.afc.LedOn'),
        command: 'TURN_ON_AFC_LED',
        disabled: false,
        toolTipDisabled: this.macroDisabled('TURN_ON_AFC_LED'),
        disabledWhilePrinting: false,
      })
    }

    if (this.afc?.td1_present) {
      buttons.push({
        icon: '',
        text: 'Capture TD',
        command: 'AFC_GET_TD_ONE_DATA',
        disabled: false,
        toolTipDisabled: this.macroDisabled('AFC_GET_TD_ONE_DATA'),
        disabledWhilePrinting: true,
      })
    }

    return buttons.filter((button) => {
      return commandsList.includes(button.command.toUpperCase())
    })
  }

  macroDisabled (macroName: string): boolean {
    const macro = this.$typedGetters['macros/getMacroByName'](macroName)
    if (macro) {
      return !macro.config?.description || macro.config.description === 'G-Code macro'
    } else {
      return true
    }
  }

  macroDescription (macroName: string) {
    const macro = this.$typedGetters['macros/getMacroByName'](macroName)
    if (macro) {
      return macro?.config?.description
    } else {
      return ''
    }
  }

  get macros () {
    const macros = this.$typedGetters['macros/getMacros']
    const settings = this.$typedState.printer.printer.configfile?.settings.afc ?? {}

    const afcMacros = []
    if (settings.wipe) {
      const wipe_name:string = settings?.wipe_cmd || 'AFC_BRUSH'
      afcMacros.push({
        text: this.$t('app.afc.BrushNozzle'),
        macroName: wipe_name,
        disabled: this.printerPrinting,
        toolTipDisabled: this.macroDisabled(wipe_name),
      })
    }

    if (settings.park) {
      const park_name:string = settings?.park_cmd || 'AFC_PARK'
      afcMacros.push({
        text: this.$t('app.afc.ParkNozzle'),
        macroName: park_name,
        disabled: this.printerPrinting,
        toolTipDisabled: this.macroDisabled(park_name),
      })
    }

    return afcMacros
      .map((button) => {
        return {
          ...button,
          macro:
            macros.find(
              (macro: Macro) => macro.name.toLowerCase() === button.macroName.toLowerCase()
            ) ?? null,
        }
      })
      .filter((button) => button.macro !== null)
  }

  downloadDebugJson () {
    const AFC_DEBUG_FILENAME = 'afc_debug.json'
    const output: {
      config: { [key: string]: any }
      settings: { [key: string]: any }
      printer: { [key: string]: any }
    } = {
      config: {},
      settings: {},
      printer: {},
    }
    const printer = this.$typedState.printer.printer ?? {}
    const config = printer.configfile?.config ?? {}
    const settings = printer.configfile?.settings ?? {}

    Object.keys(config)
      .filter((key) => key.toLowerCase().startsWith('afc'))
      .forEach((name) => {
        output.config[name] = { ...config[name] }
      })

    Object.keys(settings)
      .filter((key) => key.toLowerCase().startsWith('afc'))
      .forEach((name) => {
        output.settings[name] = { ...settings[name] }
      })

    Object.keys(printer)
      .filter((key) => key.toLowerCase().startsWith('afc'))
      .forEach((name) => {
        output.printer[name] = { ...printer[name] }
      })

    // Convert the output object to a JSON string and create a Blob for download
    const jsonString = JSON.stringify(output, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    // Create a link element to trigger the download
    const link = document.createElement('a')
    link.href = url
    link.download = AFC_DEBUG_FILENAME

    // Append the link to the body, click it to trigger download, then remove it
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up the URL object
    URL.revokeObjectURL(url)
  }
}
</script>
