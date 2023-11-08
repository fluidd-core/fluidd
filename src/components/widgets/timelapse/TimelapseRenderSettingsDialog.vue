<template>
  <app-dialog
    v-model="open"
    :title="$t('app.timelapse.title.render_settings')"
    max-width="640"
    :no-actions="!renderable"
  >
    <div class="overflow-y-auto">
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
        <v-text-field
          ref="outputFramerateElement"
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
          @change="setOutputFramerate"
        />
      </app-setting>

      <template v-else>
        <app-setting
          :title="$t('app.timelapse.setting.targetlength')"
          :sub-title="subtitleIfBlocked(targetLengthBlocked)"
        >
          <v-text-field
            ref="targetLengthElement"
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
            @change="setTargetLength"
          />
        </app-setting>

        <v-divider />

        <app-setting
          :title="$t('app.timelapse.setting.variable_fps_min')"
          :sub-title="subtitleIfBlocked(minFpsBlocked)"
        >
          <v-text-field
            ref="minFpsElement"
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
            @change="setMinFps"
          />
        </app-setting>

        <v-divider />

        <app-setting
          :title="$t('app.timelapse.setting.variable_fps_max')"
          :sub-title="subtitleIfBlocked(maxFpsBlocked)"
        >
          <v-text-field
            ref="maxFpsElement"
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
            @change="setMaxFps"
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
        <v-text-field
          ref="duplicateFramesElement"
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
          @change="setDuplicateFrames"
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
    </div>

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
import { Component, Prop, Mixins, Ref, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import type { TimelapseLastFrame, TimelapseSettings } from '@/store/timelapse/types'
import { defaultWritableSettings } from '@/store/timelapse/state'
import type { VInput } from '@/types'

@Component({})
export default class TimelapseRenderSettingsDialog extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: Boolean, required: true })
  readonly renderable!: boolean

  @Ref('outputFramerateElement')
  readonly outputFramerateElement!: VInput

  @Ref('targetLengthElement')
  readonly targetLengthElement!: VInput

  @Ref('minFpsElement')
  readonly minFpsElement!: VInput

  @Ref('maxFpsElement')
  readonly maxFpsElement!: VInput

  @Ref('duplicateFramesElement')
  readonly duplicateFramesElement!: VInput

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
    if (this.duplicateFramesElement?.validate()) {
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

  get previewImageBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('previewimage')
  }

  get previewImage (): boolean {
    return this.settings?.previewimage
  }

  set previewImage (value: boolean) {
    SocketActions.machineTimelapseSetSettings({ previewimage: value })
  }

  renderTimelapse () {
    SocketActions.machineTimelapseRender()
    this.open = false
  }

  get frameCount () {
    return this.lastFrame?.count ?? 0
  }

  get duplicateLastFrameCount () {
    return this.settings?.duplicatelastframe ?? 0
  }

  get crfBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('constant_rate_factor')
  }

  get crf (): number {
    return this.settings?.constant_rate_factor
  }

  setCRF (value: number) {
    SocketActions.machineTimelapseSetSettings({ constant_rate_factor: value })
  }

  get defaultCRF (): number {
    return defaultWritableSettings().constant_rate_factor
  }

  get settings (): TimelapseSettings {
    return this.$store.getters['timelapse/getSettings']
  }

  get lastFrame (): TimelapseLastFrame | undefined {
    return this.$store.getters['timelapse/getLastFrame']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
