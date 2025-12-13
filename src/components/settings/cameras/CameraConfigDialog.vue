<template>
  <app-dialog
    v-model="open"
    :title="camera.uid ? $t('app.general.label.edit_camera') : $t('app.general.label.add_camera')"
    :save-button-text="camera.uid ? $t('app.general.btn.save') : $t('app.general.btn.add')"
    max-width="600"
    :disabled="camera.source === 'config'"
    :no-actions="camera.source === 'config'"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
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
          v-model="camera.flip_horizontal"
          hide-details
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.camera_flip_y')">
        <v-switch
          v-model="camera.flip_vertical"
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
          :items="[
            { text: $t('app.setting.camera_rotate_options.none'), value: 0 },
            { text: $t('app.setting.camera_rotate_options.90'), value: 90 },
            { text: $t('app.setting.camera_rotate_options.180'), value: 180 },
            { text: $t('app.setting.camera_rotate_options.270'), value: 270 }
          ]"
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
            { text: $t('app.setting.camera_type_options.uv4l_mjpeg_stream'), value: 'uv4l-mjpeg' },
            { text: $t('app.setting.camera_type_options.hlsstream'), value: 'hlsstream' },
            { text: $t('app.setting.camera_type_options.webrtc_camera_streamer'), value: 'webrtc-camerastreamer' },
            { text: $t('app.setting.camera_type_options.webrtc_go2rtc'), value: 'webrtc-go2rtc' },
            { text: $t('app.setting.camera_type_options.webrtc_mediamtx'), value: 'webrtc-mediamtx' },
            { text: $t('app.setting.camera_type_options.video'), value: 'ipstream' },
            { text: $t('app.setting.camera_type_options.iframe'), value: 'iframe' }
          ]"
        />
      </app-setting>

      <v-divider />

      <template v-if="camera.service === 'mjpegstreamer-adaptive'">
        <app-setting :title="$t('app.setting.label.fps_target')">
          <v-text-field
            v-model.number="camera.target_fps"
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

        <app-setting :title="$t('app.setting.label.fps_idle_target')">
          <v-text-field
            v-model.number="camera.target_fps_idle"
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
          v-model="camera.stream_url"
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
          v-model="camera.snapshot_url"
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
            v-model="camera.aspect_ratio"
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
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'

@Component({})
export default class CameraConfigDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly camera!: Moonraker.Webcam.Entry

  handleSave () {
    this.$emit('save', this.camera)
    this.open = false
  }
}
</script>
