<template>
  <app-dialog
    v-model="open"
    :title="(user.created_on) ? $t('app.general.label.edit_user') : $t('app.general.label.add_user')"
    :save-button-text="(user.created_on) ? $t('app.general.btn.save') : $t('app.general.btn.add')"
    max-width="500"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <app-setting :title="$t('app.general.label.name')">
        <v-text-field
          v-model="user.username"
          autocomplete="username"
          :disabled="(user.created_on)"
          filled
          dense
          spellcheck="false"
          class="mt-0"
          hide-details="auto"
          :rules="[
            $rules.required,
            $rules.lengthLessThanOrEqual(60)
          ]"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.general.label.password')">
        <v-text-field
          v-model="user.password"
          autocomplete="current-password"
          filled
          dense
          type="password"
          class="mt-0"
          hide-details="auto"
          :rules="[
            $rules.required,
            $rules.lengthGreaterThanOrEqual(4),
            $rules.passwordNotEqualUsername(user.username)
          ]"
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import type { AppUser } from '@/store/auth/types'

@Component({})
export default class UserConfigDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: Object, required: true })
  readonly user!: AppUser

  handleSave () {
    this.$emit('save', this.user)
    this.open = false
  }
}
</script>
