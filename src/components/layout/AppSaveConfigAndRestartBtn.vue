<template>
  <app-btn
    v-if="isExpanded"
    color=""
    :disabled="disabled"
    :loading="loading"
    @click="$emit('click')"
  >
    <v-icon class="mr-1">
      $save
    </v-icon>
    <span>{{ $t('app.general.btn.save_config_and_restart') }}</span>
  </app-btn>

  <v-tooltip
    v-else
    bottom
  >
    <template #activator="{ on, attrs }">
      <app-btn
        v-bind="attrs"
        fab
        small
        text
        color=""
        :elevation="0"
        :disabled="disabled"
        :loading="loading"
        v-on="on"
        @click="$emit('click')"
      >
        <v-icon>$save</v-icon>
      </app-btn>
    </template>
    <span>{{ $t('app.general.btn.save_config_and_restart') }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({})
export default class AppSaveConfigAndRestartBtn extends Vue {
  @Prop({ type: Boolean, default: false })
  disabled!: boolean

  @Prop({ type: Boolean, default: false })
  loading!: boolean

  get isExpanded () {
    return this.$vuetify.breakpoint.mdAndUp
  }
}
</script>
