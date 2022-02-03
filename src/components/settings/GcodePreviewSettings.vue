<template>
  <div>
    <v-subheader id="gcodePreview">{{ $t('app.setting.title.gcode_preview') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">

      <app-setting :title="$t('app.setting.label.show_animations')">
        <v-switch
          @click.native.stop
          v-model="showAnimations"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>

      <v-divider/>

      <app-setting :title="$t('app.setting.label.group_lower_layers')">
        <v-switch
          @click.native.stop
          v-model="groupLowerLayers"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>

      <v-divider/>

      <app-setting :title="$t('app.setting.label.draw_background')">
        <v-switch
          @click.native.stop
          v-model="drawBackground"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>

      <v-divider/>

      <app-setting :title="$t('app.setting.label.extrusion_line_width')">
        <v-text-field
          :value="extrusionLineWidth"
          @change="setExtrusionLineWidth"
          :rules="[rules.numRequired, rules.numMin]"
          filled
          dense
          single-line
          hide-details
          suffix="mm"
        ></v-text-field>
      </app-setting>

      <v-divider/>

      <app-setting :title="$t('app.setting.label.move_line_width')">
        <v-text-field
          :value="moveLineWidth"
          @change="setMoveLineWidth"
          :rules="[rules.numRequired, rules.numMin]"
          filled
          dense
          single-line
          hide-details
          suffix="mm"
        ></v-text-field>
      </app-setting>

      <v-divider/>

      <app-setting :title="$t('app.setting.label.retraction_icon_size')">
        <v-text-field
          :value="retractionIconSize"
          @change="setRetractionIconSize"
          :rules="[rules.numRequired, rules.numMin]"
          filled
          dense
          single-line
          hide-details
          suffix="mm"
        ></v-text-field>
      </app-setting>

      <v-divider/>

      <app-setting :title="$t('app.setting.label.flip_horizontal')">
        <v-switch
          @click.native.stop
          v-model="flipHorizontal"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>

      <v-divider/>

      <app-setting :title="$t('app.setting.label.flip_vertical')">
        <v-switch
          @click.native.stop
          v-model="flipVertical"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>

      <v-divider/>

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
import { defaultState } from '@/store/config/index'

@Component({
  components: {}
})
export default class GcodePreviewSettings extends Vue {
  rules = {
    numRequired: (v: number | string) => v !== '' || 'Required',
    numMin: (v: number) => v > 0 || 'Must be greater than 0'
  }

  get extrusionLineWidth () {
    return this.$store.state.config.uiSettings.gcodePreview.extrusionLineWidth
  }

  setExtrusionLineWidth (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.extrusionLineWidth',
      value: +value,
      server: true
    })
  }

  get moveLineWidth () {
    return this.$store.state.config.uiSettings.gcodePreview.moveLineWidth
  }

  setMoveLineWidth (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.moveLineWidth',
      value: +value,
      server: true
    })
  }

  get retractionIconSize () {
    return this.$store.state.config.uiSettings.gcodePreview.retractionIconSize
  }

  setRetractionIconSize (value: number) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.retractionIconSize',
      value: +value,
      server: true
    })
  }

  get flipHorizontal () {
    return this.$store.state.config.uiSettings.gcodePreview.flip.horizontal
  }

  set flipHorizontal (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.flip.horizontal',
      value,
      server: true
    })
  }

  get flipVertical () {
    return this.$store.state.config.uiSettings.gcodePreview.flip.vertical
  }

  set flipVertical (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.flip.vertical',
      value,
      server: true
    })
  }

  get drawBackground () {
    return this.$store.state.config.uiSettings.gcodePreview.drawBackground
  }

  set drawBackground (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.drawBackground',
      value,
      server: true
    })
  }

  get showAnimations () {
    return this.$store.state.config.uiSettings.gcodePreview.showAnimations
  }

  set showAnimations (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.showAnimations',
      value,
      server: true
    })
  }

  get groupLowerLayers () {
    return this.$store.state.config.uiSettings.gcodePreview.groupLowerLayers
  }

  set groupLowerLayers (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.gcodePreview.groupLowerLayers',
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
