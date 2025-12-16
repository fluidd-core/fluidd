<template>
  <app-dialog
    v-model="open"
    :title="$t('app.timelapse.title.render_settings')"
    max-width="640"
    :no-actions="!renderable"
  >
    <v-card-text class="pa-0">
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

      <v-divider />

      <app-setting
        v-if="!variableFps"
        :title="$t('app.timelapse.setting.output_framerate')"
        :sub-title="subtitleIfBlocked(outputFramerateBlocked)"
      >
        <app-text-field
          :value="outputFramerate"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(0)
          ]"
          :disabled="outputFramerateBlocked"
          hide-details="auto"
          filled
          dense
          single-line
          suffix="fps"
          submit-on-change
          @submit="setOutputFramerate"
        />
      </app-setting>

      <template v-else>
        <app-setting
          :title="$t('app.timelapse.setting.targetlength')"
          :sub-title="subtitleIfBlocked(targetLengthBlocked)"
        >
          <app-text-field
            :value="targetLength"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThanOrEqual(0)
            ]"
            :disabled="targetLengthBlocked"
            hide-details="auto"
            filled
            dense
            single-line
            suffix="s"
            submit-on-change
            @submit="setTargetLength"
          />
        </app-setting>

        <v-divider />

        <app-setting
          :title="$t('app.timelapse.setting.variable_fps_min')"
          :sub-title="subtitleIfBlocked(minFpsBlocked)"
        >
          <app-text-field
            :value="minFps"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThanOrEqual(0)
            ]"
            :disabled="minFpsBlocked"
            hide-details="auto"
            filled
            dense
            single-line
            suffix="fps"
            submit-on-change
            @submit="setMinFps"
          />
        </app-setting>

        <v-divider />

        <app-setting
          :title="$t('app.timelapse.setting.variable_fps_max')"
          :sub-title="subtitleIfBlocked(maxFpsBlocked)"
        >
          <app-text-field
            :value="maxFps"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThanOrEqual(0)
            ]"
            :disabled="maxFpsBlocked"
            hide-details="auto"
            filled
            dense
            single-line
            suffix="fps"
            submit-on-change
            @submit="setMaxFps"
          />
        </app-setting>
      </template>

      <v-divider />

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

      <v-divider />

      <app-setting
        :title="$t('app.timelapse.setting.duplicatelastframe')"
        :sub-title="subtitleIfBlocked(duplicateFramesBlocked)"
      >
        <app-text-field
          :value="duplicateFrames"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(0)
          ]"
          :disabled="duplicateFramesBlocked"
          hide-details="auto"
          filled
          dense
          single-line
          :suffix="$tc('app.timelapse.label.frame', duplicateFrames)"
          submit-on-change
          @submit="setDuplicateFrames"
        />
      </app-setting>

      <v-divider />

      <app-named-slider
        :value="crf"
        class="px-4 pt-3"
        style="overflow: hidden"
        :label="$tc('app.timelapse.setting.crf')"
        :min="0"
        :max="51"
        :reset-value="defaultCRF"
        :disabled="crfBlocked"
        @change="setCRF"
      />

      <v-divider />

      <app-setting
        :title="$t('app.timelapse.setting.previewimage')"
        :sub-title="subtitleIfBlocked(previewImageBlocked)"
      >
        <v-switch
          v-model="previewImage"
          hide-details
          :disabled="previewImageBlocked"
          @click.native.stop
        />
      </app-setting>
    </v-card-text>

    <template #actions>
      <v-spacer />

      <v-tooltip left>
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            color="primary"
            v-on="on"
            @click="renderTimelapse"
          >
            <v-icon>$play</v-icon>
            {{ $t('app.timelapse.btn.render') }}
          </app-btn>
        </template>
        <span>{{ $t('app.timelapse.label.length', { length: lengthEstimate }) }}</span>
      </v-tooltip>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import type { TimelapseLastFrame } from '@/store/timelapse/types'
import { defaultWritableSettings } from '@/store/timelapse/state'

@Component({})
export default class TimelapseRenderSettingsDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Boolean, required: true })
  readonly renderable!: boolean

  get lengthEstimate () {
    const totalFrames = this.frameCount + this.duplicateLastFrameCount

    let framerate
    if (this.settings.variable_fps) {
      framerate = Math.min(
        this.settings.variable_fps_max,
        Math.max(
          this.settings.variable_fps_min,
          totalFrames / this.settings.targetlength)
      )
    } else {
      framerate = this.settings.output_framerate
    }

    const seconds = (totalFrames || 0) / framerate
    const minutes = Math.floor(seconds / 60)

    return `${minutes ? (minutes + 'm') : ''} ${Math.floor(seconds % 60)}s`.trim()
  }

  get outputFramerateBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('output_framerate')
  }

  get outputFramerate (): number {
    return this.settings.output_framerate
  }

  setOutputFramerate (value: number) {
    SocketActions.machineTimelapsePostSettings({ output_framerate: value })
  }

  get variableFpsBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('variable_fps')
  }

  get variableFps (): boolean {
    return this.settings.variable_fps
  }

  set variableFps (value: boolean) {
    SocketActions.machineTimelapsePostSettings({ variable_fps: value })
  }

  get targetLengthBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('targetlength')
  }

  get targetLength (): number {
    return this.settings.targetlength
  }

  setTargetLength (value: number) {
    SocketActions.machineTimelapsePostSettings({ targetlength: value })
  }

  get minFpsBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('variable_fps_min')
  }

  get minFps (): number {
    return this.settings.variable_fps_min
  }

  setMinFps (value: number) {
    SocketActions.machineTimelapsePostSettings({ variable_fps_min: value })
  }

  get maxFpsBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('variable_fps_max')
  }

  get maxFps (): number {
    return this.settings.variable_fps_max
  }

  setMaxFps (value: number) {
    SocketActions.machineTimelapsePostSettings({ variable_fps_max: value })
  }

  get duplicateFramesBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('duplicatelastframe')
  }

  get duplicateFrames (): number {
    return this.settings.duplicatelastframe
  }

  setDuplicateFrames (value: number) {
    SocketActions.machineTimelapsePostSettings({ duplicatelastframe: value })
  }

  get saveFramesBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('saveframes')
  }

  get saveFrames (): boolean {
    return this.settings.saveframes
  }

  set saveFrames (value: boolean) {
    SocketActions.machineTimelapsePostSettings({ saveframes: value })
  }

  get previewImageBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('previewimage')
  }

  get previewImage (): boolean {
    return this.settings.previewimage
  }

  set previewImage (value: boolean) {
    SocketActions.machineTimelapsePostSettings({ previewimage: value })
  }

  renderTimelapse () {
    SocketActions.machineTimelapseRender()
    this.open = false
  }

  get frameCount () {
    return this.lastFrame?.count ?? 0
  }

  get duplicateLastFrameCount () {
    return this.settings.duplicatelastframe ?? 0
  }

  get crfBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('constant_rate_factor')
  }

  get crf (): number {
    return this.settings.constant_rate_factor
  }

  setCRF (value: number) {
    SocketActions.machineTimelapsePostSettings({ constant_rate_factor: value })
  }

  get defaultCRF (): number {
    return defaultWritableSettings.constant_rate_factor
  }

  get settings (): Moonraker.Timelapse.WriteableSettings {
    return this.$typedState.timelapse.settings ?? defaultWritableSettings
  }

  get lastFrame (): TimelapseLastFrame | null {
    return this.$typedGetters['timelapse/getLastFrame']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
