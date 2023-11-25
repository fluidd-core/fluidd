<template>
  <app-dialog
    v-model="open"
    :title="(camera.id != '') ? $t('app.general.label.edit_camera') : $t('app.general.label.add_camera')"
    :cancel-button-text="camera.source === 'config' ? $t('app.general.btn.close') : $t('app.general.btn.cancel')"
    :save-button-text="(camera.id !== '') ? $t('app.general.btn.save') : $t('app.general.btn.add')"
    max-width="600"
    :disabled="camera.source === 'config'"
    @save="handleSave"
  >
    <div class="overflow-y-auto">
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
            { text: $t('app.setting.camera_type_options.hlsstream'), value: 'hlsstream' },
            { text: $t('app.setting.camera_type_options.webrtc_camera_streamer'), value: 'webrtc-camerastreamer' },
            { text: $t('app.setting.camera_type_options.video'), value: 'ipstream' },
            { text: $t('app.setting.camera_type_options.iframe'), value: 'iframe' },
            { text: $t('app.setting.camera_type_options.webrtc_gortc'), value: 'webrtc-go2rtc' }
          ]"
          item-value="value"
          item-text="text"
        />
      </app-setting>

      <v-divider />

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

      <app-setting :title="$t('app.setting.label.camera_url_stream')">
        <v-text-field
          v-model="camera.urlStream"
          type="url"
          spellcheck="false"
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

      <app-setting :title="$t('app.setting.label.camera_url_snapshot')">
        <v-text-field
          v-model="camera.urlSnapshot"
          type="url"
          spellcheck="false"
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

      <template v-if="camera.service === 'iframe'">
        <v-divider />

        <app-setting
          :title="$t('app.setting.label.aspect_ratio')"
          :sub-title="$t('app.setting.label.aspect_ratio_format')"
        >
          <v-text-field
            v-model="camera.aspectRatio"
            spellcheck="false"
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
    </div>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import type { CameraConfig } from '@/store/cameras/types'

@Component({})
export default class CameraConfigDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: Object, required: true })
  readonly camera!: CameraConfig

  handleSave () {
    this.$emit('save', this.camera)
    this.open = false
  }
}
</script>
