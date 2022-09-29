<template>
  <v-dialog
    :value="value"
    :max-width="500"
    scrollable
    @input="$emit('input', $event)"
  >
    <v-form
      ref="form"
      v-model="valid"
      :disabled="camera.source === 'config'"
      @submit.prevent="handleSave()"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ (camera.id != '') ? $t('app.general.label.edit_camera') : $t('app.general.label.add_camera') }}</span>
        </v-card-title>

        <v-divider />

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
            :rules="[rules.required]"
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

        <app-setting
          v-if="camera.service === 'mjpegstreamer-adaptive'"
          :title="$t('app.setting.label.fps_target')"
        >
          <v-text-field
            v-model.number="camera.targetFps"
            class="mt-5"
            filled
            dense
            single-line
            hide-details="auto"
            :rules="[rules.required]"
          />
        </app-setting>

        <v-divider v-if="camera.service === 'mjpegstreamer-adaptive'" />

        <app-setting
          v-if="camera.service === 'mjpegstreamer-adaptive'"
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

        <v-divider v-if="camera.service === 'mjpegstreamer-adaptive'" />

        <app-setting :title="$t('app.setting.label.camera_url')">
          <v-text-field
            v-model="camera.urlStream"
            class="mt-5"
            filled
            dense
            single-line
            hide-details="auto"
            :rules="[rules.required]"
          />
        </app-setting>

        <v-divider />

        <app-setting
          v-if="camera.service === 'iframe'"
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
            :rules="[rules.required, rules.aspect]"
          />
        </app-setting>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <app-btn
            color="warning"
            text
            type="button"
            @click="$emit('input', false)"
          >
            {{ camera.source === 'config' ? $t('app.general.btn.close') : $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            v-if="camera.source !== 'config'"
            color="primary"
            type="submit"
          >
            {{ (camera.id !== '') ? $t('app.general.btn.save') : $t('app.general.btn.add') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { CameraConfig } from '@/store/cameras/types'

@Component({})
export default class CameraConfigDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  readonly value!: boolean

  @Prop({ type: Object, required: true })
  readonly camera!: CameraConfig

  cameraUrlRules = [
    (v: string) => !!v || 'Required'
  ]

  valid = false

  rules = {
    required: (v: string) => (v !== undefined && v !== '') || this.$t('app.general.simple_form.error.required'),
    minFps: (v: number) => (v >= 1) || this.$t('app.general.simple_form.error.min', { min: 1 }),
    maxFps: (v: number) => (v <= 60) || this.$t('app.general.simple_form.error.max', { max: 60 }),
    aspect: (v: string) => /^\d+\s*[:/]\s*\d+$/.test(v) || this.$t('app.general.simple_form.error.invalid_aspect')
  }

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.camera)
      this.$emit('input', false)
    }
  }
}
</script>
