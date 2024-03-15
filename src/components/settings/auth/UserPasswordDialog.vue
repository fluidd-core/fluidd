<template>
  <app-dialog
    v-model="open"
    :title="$t('app.general.label.change_password')"
    :cancel-button-loading="loading"
    :save-button-loading="loading"
    max-width="500"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <template v-if="error">
        <v-alert
          type="error"
          text
          class="mx-4 mt-4"
        >
          {{ $t('app.general.msg.wrong_password') }}
        </v-alert>

        <v-divider />
      </template>

      <app-setting :title="$t('app.general.label.current_password')">
        <v-text-field
          v-model="currentPassword"
          autocomplete="current-password"
          filled
          dense
          type="password"
          class="mt-0"
          hide-details="auto"
          :rules="[
            $rules.required
          ]"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.general.label.new_password')">
        <v-text-field
          v-model="password"
          autocomplete="current-password"
          filled
          dense
          type="password"
          class="mt-0"
          hide-details="auto"
          :rules="[
            $rules.required,
            $rules.lengthGreaterThanOrEqual(4),
            $rules.passwordNotEqualUsername(currentUser)
          ]"
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { httpClientActions } from '@/api/httpClientActions'
import { Component, Vue, VModel } from 'vue-property-decorator'
import { EventBus } from '@/eventBus'

@Component({})
export default class UserPasswordDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  currentPassword = ''
  password = ''
  error = false
  loading = false

  get currentUser () {
    const currentUser = this.$store.getters['auth/getCurrentUser']
    return (currentUser && currentUser.username) ? currentUser.username : ''
  }

  async handleSave () {
    try {
      this.loading = true

      await httpClientActions.accessUserPasswordPost(this.currentPassword, this.password)

      EventBus.$emit(this.$tc('app.general.msg.password_changed'), { timeout: 2000 })

      this.open = false
    } catch {
      this.error = true
    } finally {
      this.loading = false
    }
  }
}
</script>
