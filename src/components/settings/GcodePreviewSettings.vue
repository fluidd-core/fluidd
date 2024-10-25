<template>
  <div>
    <v-subheader id="gcodePreview">
      {{ $t('app.setting.title.gcode_preview') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting :title="$t('app.setting.label.show_animations')">
        <v-switch
          v-model="showAnimations"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.draw_origin')">
        <v-switch
          v-model="drawOrigin"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.draw_background')">
        <v-switch
          v-model="drawBackground"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.default_min_layer_height')">
        <v-text-field
          :value="minLayerHeight"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(0.1)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm"
          @change="setMinLayerHeight"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.extrusion_line_width')">
        <v-text-field
          :value="extrusionLineWidth"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThan(0)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm"
          @change="setExtrusionLineWidth"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.move_line_width')">
        <v-text-field
          :value="moveLineWidth"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThan(0)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm"
          @change="setMoveLineWidth"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.retraction_icon_size')">
        <v-text-field
          :value="retractionIconSize"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThan(0)
          ]"
          filled
          dense
          single-line
          hide-details="auto"
          suffix="mm"
          @change="setRetractionIconSize"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.flip_horizontal')">
        <v-switch
          v-model="flipHorizontal"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.flip_vertical')">
        <v-switch
          v-model="flipVertical"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.auto_load_on_print_start')">
        <v-switch
          v-model="autoLoadOnPrintStart"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <template v-if="autoLoadOnPrintStart">
        <v-divider />

        <app-setting :title="$t('app.setting.label.auto_load_mobile_on_print_start')">
          <v-switch
            v-model="autoLoadMobileOnPrintStart"
            hide-details
            class="mb-5"
            @click.native.stop
          />
        </app-setting>
      </template>

      <v-divider />

      <app-setting :title="$t('app.setting.label.auto_follow_on_file_load')">
        <v-switch
          v-model="autoFollowOnFileLoad"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.hide_single_part_bounding_box')">
        <v-switch
          v-model="hideSinglePartBoundingBox"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.reset')">
        <app-btn
          outlined
          small
          color="primary"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { defaultState } from '@/store/config/state'

@Component({
  components: {}
})
export default class GcodePreviewSettings extends Vue {
  get extrusionLineWidth (): number {
    return this.$store.state.config.uiSettings.gcodePreview.extrusionLineWidth
  }

  setExtrusionLineWidth (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.extrusionLineWidth',
      value: +value,
      server: true
    })
  }

  get moveLineWidth (): number {
    return this.$store.state.config.uiSettings.gcodePreview.moveLineWidth
  }

  setMoveLineWidth (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.moveLineWidth',
      value: +value,
      server: true
    })
  }

  get retractionIconSize (): number {
    return this.$store.state.config.uiSettings.gcodePreview.retractionIconSize
  }

  setRetractionIconSize (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.retractionIconSize',
      value: +value,
      server: true
    })
  }

  get flipHorizontal (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.flip.horizontal
  }

  set flipHorizontal (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.flip.horizontal',
      value,
      server: true
    })
  }

  get flipVertical (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.flip.vertical
  }

  set flipVertical (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.flip.vertical',
      value,
      server: true
    })
  }

  get drawOrigin (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.drawOrigin
  }

  set drawOrigin (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.drawOrigin',
      value,
      server: true
    })
  }

  get drawBackground (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.drawBackground
  }

  set drawBackground (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.drawBackground',
      value,
      server: true
    })
  }

  get showAnimations (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.showAnimations
  }

  set showAnimations (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showAnimations',
      value,
      server: true
    })
  }

  get minLayerHeight (): number {
    return this.$store.state.config.uiSettings.gcodePreview.minLayerHeight
  }

  setMinLayerHeight (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.minLayerHeight',
      value: +value,
      server: true
    })
  }

  get autoLoadOnPrintStart (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.autoLoadOnPrintStart
  }

  set autoLoadOnPrintStart (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.autoLoadOnPrintStart',
      value,
      server: true
    })

    if (!value) {
      this.autoLoadMobileOnPrintStart = false
    }
  }

  get autoLoadMobileOnPrintStart (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.autoLoadMobileOnPrintStart
  }

  set autoLoadMobileOnPrintStart (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.autoLoadMobileOnPrintStart',
      value,
      server: true
    })
  }

  get autoFollowOnFileLoad (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.autoFollowOnFileLoad
  }

  set autoFollowOnFileLoad (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.autoFollowOnFileLoad',
      value,
      server: true
    })
  }

  get hideSinglePartBoundingBox (): boolean {
    return this.$store.state.config.uiSettings.gcodePreview.hideSinglePartBoundingBox
  }

  set hideSinglePartBoundingBox (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.hideSinglePartBoundingBox',
      value,
      server: true
    })
  }

  handleReset () {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview',
      value: defaultState().uiSettings.gcodePreview,
      server: true
    })
  }
}
</script>
