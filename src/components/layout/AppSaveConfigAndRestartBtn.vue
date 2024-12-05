<template>
  <app-btn
    v-if="isExpanded"
    :disabled="disabled"
    :loading="loading"
    @click="$emit('click')"
  >
    <v-icon
      left
      color="warning"
    >
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
        color="warning"
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
  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly loading?: boolean

  get isExpanded () {
    return this.$vuetify.breakpoint.mdAndUp
  }
}
</script>
