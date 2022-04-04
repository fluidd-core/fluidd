<template>
  <v-dialog
    :value="open"
    :max-width="640"
  >
    <v-card v-if="open">
      <v-card-title class="card-heading py-2">
        <v-col cols="11">
          <v-icon left>
            $cog
          </v-icon>
          <span class="focus--text">
            {{ $t('app.timelapse.title.render_settings') }}
          </span>
        </v-col>

        <v-col
          class="text-right"
          cols="1"
        >
          <v-icon @click="$emit('close')">
            $close
          </v-icon>
        </v-col>
      </v-card-title>

      <v-card-text>
        <app-setting
          :title="$t('app.timelapse.setting.variable_fps')"
          :sub-title="subtitleIfBlocked(variableFpsBlocked)"
        >
          <v-switch
            v-model="variableFps"
            hide-details
            :disabled="variableFpsBlocked"
            @click.native.stop
          />
        </app-setting>
        <app-setting
          v-if="!variableFps"
          :title="$t('app.timelapse.setting.output_framerate')"
          :sub-title="subtitleIfBlocked(outputFramerateBlocked)"
        >
          <v-text-field
            ref="outputFramerateElement"
            :value="outputFramerate"
            :rules="[rules.numRequired, rules.validNum, rules.numMin]"
            :disabled="outputFramerateBlocked"
            :hide-details="outputFramerateElement ? outputFramerateElement.valid : true"
            filled
            dense
            single-line
            suffix="fps"
            @change="setOutputFramerate"
          />
        </app-setting>
        <div v-else>
          <app-setting
            :title="$t('app.timelapse.setting.targetlength')"
            :sub-title="subtitleIfBlocked(targetLengthBlocked)"
          >
            <v-text-field
              ref="targetLengthElement"
              :value="targetLength"
              :rules="[rules.numRequired, rules.validNum, rules.numMin]"
              :disabled="targetLengthBlocked"
              :hide-details="targetLengthElement ? targetLengthElement.valid : true"
              filled
              dense
              single-line
              suffix="s"
              @change="setTargetLength"
            />
          </app-setting>
          <app-setting
            :title="$t('app.timelapse.setting.variable_fps_min')"
            :sub-title="subtitleIfBlocked(minFpsBlocked)"
          >
            <v-text-field
              ref="minFpsElement"
              :value="minFps"
              :rules="[rules.numRequired, rules.validNum, rules.numMin]"
              :disabled="minFpsBlocked"
              :hide-details="minFpsElement ? minFpsElement.valid : true"
              filled
              dense
              single-line
              suffix="fps"
              @change="setMinFps"
            />
          </app-setting>
          <app-setting
            :title="$t('app.timelapse.setting.variable_fps_max')"
            :sub-title="subtitleIfBlocked(maxFpsBlocked)"
          >
            <v-text-field
              ref="maxFpsElement"
              :value="maxFps"
              :rules="[rules.numRequired, rules.validNum, rules.numMin]"
              :disabled="maxFpsBlocked"
              :hide-details="maxFpsElement ? maxFpsElement.valid : true"
              filled
              dense
              single-line
              suffix="fps"
              @change="setMaxFps"
            />
          </app-setting>
        </div>
        <app-setting
          :title="$t('app.timelapse.setting.saveframes')"
          :sub-title="subtitleIfBlocked(saveFramesBlocked)"
        >
          <v-switch
            v-model="saveFrames"
            hide-details
            :disabled="saveFramesBlocked"
            @click.native.stop
          />
        </app-setting>
        <app-setting
          :title="$t('app.timelapse.setting.duplicatelastframe')"
          :sub-title="subtitleIfBlocked(duplicateFramesBlocked)"
        >
          <v-text-field
            ref="duplicateFramesElement"
            :value="duplicateFrames"
            :rules="[rules.numRequired, rules.validNum, rules.numMin]"
            :disabled="duplicateFramesBlocked"
            :hide-details="duplicateFramesElement ? duplicateFramesElement.valid : true"
            filled
            dense
            single-line
            :suffix="$tc('app.timelapse.label.frame', duplicateFrames)"
            @change="setDuplicateFrames"
          />
        </app-setting>
      </v-card-text>

      <v-card-actions
        v-if="renderable"
        class="pt-4"
      >
        <v-spacer />
        <app-btn
          color="primary"
          @click="renderTimelapse"
        >
          <v-icon>$play</v-icon>
          {{ $t('app.timelapse.btn.render') }}
        </app-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import AppSetting from '@/components/ui/AppSetting.vue'
import { TimelapseSettings } from '@/store/timelapse/types'

@Component({
  components: { AppSetting }
})
export default class TimelapseRenderSettingsDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean }) open = false
  @Prop({ type: Boolean }) renderable = false

  @Ref('outputFramerateElement') outputFramerateElement!: any
  @Ref('targetLengthElement') targetLengthElement!: any
  @Ref('minFpsElement') minFpsElement!: any
  @Ref('maxFpsElement') maxFpsElement!: any
  @Ref('duplicateFramesElement') duplicateFramesElement!: any

  rules = {
    numRequired: (v: number | string) => v !== '' || this.$t('app.general.simple_form.error.required'),
    validNum: (v: string) => !isNaN(+v) || this.$t('app.general.simple_form.error.invalid_number'),
    numMin: (v: number) => v >= 0 || this.$t('app.general.simple_form.error.min', { min: 0 })
  }

  get outputFramerateBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('output_framerate')
  }

  get outputFramerate (): number {
    return this.settings?.output_framerate
  }

  setOutputFramerate (value: number) {
    if (this.outputFramerateElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ output_framerate: value })
    }
  }

  get variableFpsBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('variable_fps')
  }

  get variableFps (): boolean {
    return this.settings?.variable_fps
  }

  set variableFps (value: boolean) {
    SocketActions.machineTimelapseSetSettings({ variable_fps: value })
  }

  get targetLengthBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('targetlength')
  }

  get targetLength (): number {
    return this.settings?.targetlength
  }

  setTargetLength (value: number) {
    if (this.targetLengthElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ targetlength: value })
    }
  }

  get minFpsBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('variable_fps_min')
  }

  get minFps (): number {
    return this.settings?.variable_fps_min
  }

  setMinFps (value: number) {
    if (this.minFpsElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ variable_fps_min: value })
    }
  }

  get maxFpsBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('variable_fps_max')
  }

  get maxFps (): number {
    return this.settings?.variable_fps_max
  }

  setMaxFps (value: number) {
    if (this.maxFpsElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ variable_fps_max: value })
    }
  }

  get duplicateFramesBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('duplicatelastframe')
  }

  get duplicateFrames (): number {
    return this.settings?.duplicatelastframe
  }

  setDuplicateFrames (value: number) {
    if (this.maxFpsElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ duplicatelastframe: value })
    }
  }

  get saveFramesBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('saveframes')
  }

  get saveFrames (): boolean {
    return this.settings?.saveframes
  }

  set saveFrames (value: boolean) {
    SocketActions.machineTimelapseSetSettings({ saveframes: value })
  }

  renderTimelapse () {
    SocketActions.machineTimelapseRender()
    this.$emit('close')
  }

  get settings (): TimelapseSettings {
    return this.$store.getters['timelapse/getSettings']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.timelapse.tooltip.managed_by_moonraker') : ''
  }
}
</script>
