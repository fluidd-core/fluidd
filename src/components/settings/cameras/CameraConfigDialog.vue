<template>
  <app-dialog
    v-model="open"
    :title="(camera.id != '') ? $t('app.general.label.edit_camera') : $t('app.general.label.add_camera')"
    :cancel-button-text="camera.source === 'config' ? $t('app.general.btn.close') : $t('app.general.btn.cancel')"
    :save-button-text="(camera.id !== '') ? $t('app.general.btn.save') : $t('app.general.btn.add')"
    :max-width="500"
    :disabled="camera.source === 'config'"
    @save="handleSave"
  >
    <app-setting :title="$t('app.setting.label.enable')">
      <v-switch
        v-model="camera.enabled"
        class="mt-0"
        hide-details="auto"
      />
    </app-setting>

    <v-divider />

    <app-setting :title="$t('app.general.label.name')">
      <v-text-field
        v-model="camera.name"
        filled
        dense
        class="mt-0"
        hide-details="auto"
        :rules="[
          $rules.required
        ]"
      />
    </app-setting>

    <v-divider />

    <app-setting :title="$t('app.setting.label.camera_flip_x')">
      <v-switch
        v-model="camera.flipX"
        hide-details
      />
    </app-setting>

    <v-divider />

    <app-setting :title="$t('app.setting.label.camera_flip_y')">
      <v-switch
        v-model="camera.flipY"
        class="mb-4"
        hide-details
      />
    </app-setting>

    <v-divider />

    <app-setting :title="$t('app.setting.label.camera_rotate_by')">
      <v-select
        v-model.number="camera.rotation"
        filled
        dense
        hide-details="auto"
        initial-value="false"
        :items="[
          { text: $t('app.setting.camera_rotate_options.none'), value: 0 },
          { text: $t('app.setting.camera_rotate_options.90'), value: 90 },
          { text: $t('app.setting.camera_rotate_options.180'), value: 180 },
          { text: $t('app.setting.camera_rotate_options.270'), value: 270 }
        ]"
        item-value="value"
        item-text="text"
      />
    </app-setting>

    <v-divider />

    <app-setting :title="$t('app.setting.label.camera_stream_type')">
      <v-select
        v-model="camera.service"
        filled
        dense
        hide-details="auto"
        :items="[
          { text: $t('app.setting.camera_type_options.mjpegadaptive'), value: 'mjpegstreamer-adaptive' },
          { text: $t('app.setting.camera_type_options.mjpegstream'), value: 'mjpegstreamer' },
          { text: $t('app.setting.camera_type_options.video'), value: 'ipstream' },
          { text: $t('app.setting.camera_type_options.iframe'), value: 'iframe' }
        ]"
        item-value="value"
        item-text="text"
      />
    </app-setting>

    <v-divider />

    <template v-if="camera.service?.startsWith('mjpegstreamer')">
      <app-setting :title="$t('app.setting.label.camera_crowsnest_served')">
        <v-switch
          v-model="camera.isCrowsnestServed"
          filled
          dense
          hide-details="auto"
          item-value="value"
          item-text="text"
        />
      </app-setting>

      <v-divider />
    </template>

    <template v-if="camera.service === 'mjpegstreamer-adaptive'">
      <app-setting

        :title="$t('app.setting.label.fps_target')"
      >
        <v-text-field
          v-model.number="camera.targetFps"
          class="mt-5"
          filled
          dense
          single-line
          hide-details="auto"
          :rules="[
            $rules.required
          ]"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.fps_idle_target')"
      >
        <v-text-field
          v-model.number="camera.targetFpsIdle"
          class="mt-5"
          filled
          dense
          single-line
          hide-details="auto"
        />
      </app-setting>

      <v-divider />
    </template>

    <app-setting :title="$t('app.setting.label.camera_url')">
      <v-text-field
        v-model="camera.urlStream"
        class="mt-5"
        filled
        dense
        single-line
        hide-details="auto"
        :rules="[
          $rules.required
        ]"
        :success="urlReachable === true"
        :error="urlReachable === false"
        :messages="urlMessage"
        @input="handleUrlChange"
      />
    </app-setting>

    <template v-if="camera.service === 'iframe'">
      <v-divider />

      <app-setting
        :title="$t('app.setting.label.aspect_ratio')"
        :sub-title="$t('app.setting.label.aspect_ratio_format')"
      >
        <v-text-field
          v-model="camera.aspectRatio"
          class="mt-5"
          filled
          dense
          single-line
          hide-details="auto"
          :rules="[
            $rules.required,
            $rules.aspectRatioValid
          ]"
        />
      </app-setting>
    </template>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'
import { Debounce } from 'vue-debounce-decorator'

@Component({})
export default class CameraConfigDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly camera!: CameraConfig

  urlReachable: boolean | null = null
  urlMessage = ''

  created () {
    if (this.camera.urlStream) {
      this.handleUrlChange(this.camera.urlStream)
    }
  }

  handleSave () {
    this.$emit('save', this.camera)
    this.open = false
  }

  @Debounce({ time: 200 })
  async handleUrlChange (input: string) {
    if (this.camera.service?.startsWith('mjpegstreamer')) {
      let servedByCrowsnest = false

      try {
        const fetchResult = await fetch(input)
        this.urlReachable = fetchResult.ok
        if (fetchResult.headers.has('X-UStreamer-Online')) {
          servedByCrowsnest = true
        }
      } catch (err) {
        this.urlReachable = false
      }

      this.urlMessage = this.$tc(`app.setting.label.camera_${this.urlReachable ? 'reachable' : 'unreachable'}`)
      if (servedByCrowsnest) {
        this.camera.isCrowsnestServed = true
        this.urlMessage = this.$tc('app.setting.label.camera_reachable_crowsnest')
      }
    }
  }
}
</script>
