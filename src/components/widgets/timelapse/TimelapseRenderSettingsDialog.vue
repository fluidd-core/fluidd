<template>
  <v-dialog
    v-model="value"
    :max-width="640"
  >
    <v-card v-if="value">
      <v-card-title class="card-heading py-2">
        <span class="focus--text">{{ $t('app.timelapse.title.render_settings') }}</span>

        <v-spacer />
        <app-btn
          color=""
          icon
          @click="$emit('input', false)"
        >
          <v-icon>$close</v-icon>
        </app-btn>
      </v-card-title>

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
          v-model="outputFramerate"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(0)
          ]"
          :disabled="outputFramerateBlocked"
          :hide-details="outputFramerateElement ? outputFramerateElement.valid : true"
          filled
          dense
          single-line
          suffix="fps"
        />
      </app-setting>
      <div v-else>
        <app-setting
          :title="$t('app.timelapse.setting.targetlength')"
          :sub-title="subtitleIfBlocked(targetLengthBlocked)"
        >
          <v-text-field
            ref="targetLengthElement"
            v-model="targetLength"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThanOrEqual(0)
            ]"
            :disabled="targetLengthBlocked"
            :hide-details="targetLengthElement ? targetLengthElement.valid : true"
            filled
            dense
            single-line
            suffix="s"
          />
        </app-setting>

        <v-divider />
        <app-setting
          :title="$t('app.timelapse.setting.variable_fps_min')"
          :sub-title="subtitleIfBlocked(minFpsBlocked)"
        >
          <v-text-field
            ref="minFpsElement"
            v-model="minFps"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThanOrEqual(0)
            ]"
            :disabled="minFpsBlocked"
            :hide-details="minFpsElement ? minFpsElement.valid : true"
            filled
            dense
            single-line
            suffix="fps"
          />
        </app-setting>

        <v-divider />
        <app-setting
          :title="$t('app.timelapse.setting.variable_fps_max')"
          :sub-title="subtitleIfBlocked(maxFpsBlocked)"
        >
          <v-text-field
            ref="maxFpsElement"
            v-model="maxFps"
            :rules="[
              $rules.required,
              $rules.numberValid,
              $rules.numberGreaterThanOrEqual(0)
            ]"
            :disabled="maxFpsBlocked"
            :hide-details="maxFpsElement ? maxFpsElement.valid : true"
            filled
            dense
            single-line
            suffix="fps"
          />
        </app-setting>
      </div>

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
          v-model="duplicateFrames"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(0)
          ]"
          :disabled="duplicateFramesBlocked"
          :hide-details="duplicateFramesElement ? duplicateFramesElement.valid : true"
          filled
          dense
          single-line
          :suffix="$tc('app.timelapse.label.frame', duplicateFrames)"
        />
      </app-setting>

      <v-divider />
      <app-slider
        v-model="crf"
        class="px-4 pt-3"
        style="overflow: hidden"
        :label="$tc('app.timelapse.setting.crf')"
        :min="0"
        :max="51"
        :reset-value="defaultCRF"
        :disabled="crfBlocked"
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

      <v-divider v-if="renderable" />
      <v-card-actions
        v-if="renderable"
        class="pt-4"
      >
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
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import AppSetting from '@/components/ui/AppSetting.vue'
import { TimelapseLastFrame, TimelapseSettings } from '@/store/timelapse/types'
import { defaultWritableSettings } from '@/store/timelapse'
import { VInput } from '@/types'

@Component({
  components: { AppSetting }
})
export default class TimelapseRenderSettingsDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

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

  set outputFramerate (value: number) {
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

  set targetLength (value: number) {
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

  set minFps (value: number) {
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

  set maxFps (value: number) {
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

  set duplicateFrames (value: number) {
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
    this.$emit('input', false)
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

  set crf (value: number) {
    SocketActions.machineTimelapseSetSettings({ constant_rate_factor: value })
  }

  get defaultCRF (): number {
    return defaultWritableSettings.constant_rate_factor
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
