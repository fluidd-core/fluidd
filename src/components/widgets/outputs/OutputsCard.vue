<template>
  <collapsable-card
    :title="$t('app.general.title.fans_outputs')"
    icon="$motion"
    draggable
    layout-path="dashboard.outputs-card"
    menu-breakpoint="lg"
  >
    <template #menu>
      <v-menu
        bottom
        left
        offset-y
        transition="slide-y-transition"
        :close-on-content-click="false"
      >
        <template #activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
          >
            <v-icon dense>
              $cog
            </v-icon>
          </v-btn>
        </template>

        <v-list dense>
          <v-list-item
            :title="$t('app.setting.label.show_hidden')"
            @click="showHidden = !showHidden"
          >
            <v-list-item-action class="my-0">
              <v-checkbox :input-value="showHidden" />
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ $t('app.setting.label.show_hidden') }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </template>
    <outputs />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Outputs from '@/components/widgets/outputs/Outputs.vue'

@Component({
  components: {
    Outputs
  }
})
export default class OutputsCard extends Vue {
  get showHidden () {
    return this.$store.state.config.uiSettings.general.showHiddenOutputs
  }

  set showHidden (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showHiddenOutputs',
      value,
      server: true
    })
  }
}
</script>
