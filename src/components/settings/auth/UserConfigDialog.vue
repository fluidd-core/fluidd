<template>
  <v-dialog
    v-model="open"
    :max-width="500"
  >
    <v-form
      ref="form"
      v-model="valid"
      @submit.prevent="handleSave"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ (user.created_on) ? $t('app.general.label.edit_user') : $t('app.general.label.add_user') }}</span>
        </v-card-title>

        <v-divider />

        <app-setting :title="$t('app.general.label.name')">
          <v-text-field
            v-model="user.username"
            autocomplete="username"
            :disabled="(user.created_on)"
            filled
            dense
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

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <app-btn
            color="warning"
            text
            type="button"
            @click="open = false"
          >
            {{ $t('app.general.btn.cancel') }}
          </app-btn>
          <app-btn
            color="primary"
            type="submit"
          >
            {{ (user.created_on) ? $t('app.general.btn.save') : $t('app.general.btn.add') }}
          </app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop, VModel } from 'vue-property-decorator'
import { AppUser } from '@/store/auth/types'

@Component({})
export default class UserConfigDialog extends Vue {
  @VModel({ type: Boolean, required: true })
    open!: boolean

  @Prop({ type: Object, required: true })
  readonly user!: AppUser

  valid = false

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.user)
      this.open = false
    }
  }
}
</script>
