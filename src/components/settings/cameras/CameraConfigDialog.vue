<template>
  <v-dialog
    :value="value"
    :max-width="500"
    @input="$emit('input', $event)"
  >
    <v-form
      ref="form"
      v-model="valid"
      @submit.prevent="handleSave(camera)"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ (camera.id != -1) ? $t('app.general.label.edit_camera') : $t('app.general.label.add_camera') }}</span>
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
            v-model="camera.rotate"
            filled
            dense
            hide-details="auto"
            initial-value="false"
            :items="[
              {
                text: $t('app.setting.camera_rotate_options.none'),
                value: '',
              },
              { text: $t('app.setting.camera_rotate_options.90'), value: '90' },
              {
                text: $t('app.setting.camera_rotate_options.180'),
                value: '180',
              },
              {
                text: $t('app.setting.camera_rotate_options.270'),
                value: '270',
              },
            ]"
            item-value="value"
            item-text="text"
          />
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.setting.label.camera_stream_type')">
          <v-select
            v-model="camera.type"
            filled
            dense
            hide-details="auto"
            :items="[
              { text: $t('app.setting.camera_type_options.mjpegadaptive'), value: 'mjpgadaptive' },
              { text: $t('app.setting.camera_type_options.mjpegstream'), value: 'mjpgstream' },
              { text: $t('app.setting.camera_type_options.video'), value: 'ipstream' },
              { text: $t('app.setting.camera_type_options.iframe'), value: 'iframe' }
            ]"
            item-value="value"
            item-text="text"
          />
        </app-setting>

        <v-divider />

        <app-setting
          v-if="camera.type === 'mjpgadaptive'"
          :title="$t('app.setting.label.fps_target')"
        >
          <v-text-field
            v-model.number="camera.fpstarget"
            class="mt-5"
            filled
            dense
            single-line
            hide-details="auto"
            :rules="[rules.required]"
          />
        </app-setting>

        <v-divider v-if="camera.type === 'mjpgadaptive'" />

        <app-setting
          v-if="camera.type === 'mjpgadaptive'"
          :title="$t('app.setting.label.fps_idle_target')"
        >
          <v-text-field
            v-model.number="camera.fpsidletarget"
            class="mt-5"
            filled
            dense
            single-line
            hide-details="auto"
          />
        </app-setting>

        <v-divider v-if="camera.type === 'mjpgadaptive'" />

        <app-setting :title="$t('app.setting.label.camera_url')">
          <v-text-field
            v-model="camera.url"
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
          v-if="camera.type === 'iframe'"
          :title="$t('app.setting.label.height')"
        >
          <v-text-field
            v-model.number="camera.height"
            class="mt-5"
            filled
            dense
            single-line
            hide-details="auto"
            :rules="[rules.required]"
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
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            color="primary"
            type="submit"
          >
            {{ (camera.id !== -1) ? $t('app.general.btn.save') : $t('app.general.btn.add') }}
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
    maxFps: (v: number) => (v <= 60) || this.$t('app.general.simple_form.error.max', { max: 60 })
  }

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.camera)
      this.$emit('input', false)
    }
  }
}
</script>
