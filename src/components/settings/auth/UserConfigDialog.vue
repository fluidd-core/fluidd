<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
    :max-width="500"
  >
    <v-form
      ref="form"
      @submit.prevent="handleSave(user)"
      v-model="valid"
    >
      <v-card>
        <v-card-title class="card-heading py-2">
          <span class="focus--text">{{ (user.created_on) ? $t('app.general.label.edit_user') : $t('app.general.label.add_user') }}</span>
        </v-card-title>

        <v-divider />

        <app-setting :title="$t('app.general.label.name')">
          <v-text-field
            autocomplete="username"
            :disabled="(user.created_on)"
            filled
            dense
            class="mt-0"
            hide-details="auto"
            :rules="[rules.required, rules.max]"
            v-model="user.username">
          </v-text-field>
        </app-setting>

        <v-divider />

        <app-setting :title="$t('app.general.label.password')">
          <v-text-field
            autocomplete="current-password"
            filled
            dense
            type="password"
            class="mt-0"
            hide-details="auto"
            :rules="[rules.required, rules.min, rules.password]"
            v-model="user.password">
          </v-text-field>
        </app-setting>

        <v-divider />

        <v-card-actions>
          <v-spacer></v-spacer>
          <app-btn color="warning" text @click="$emit('input', false)" type="button">{{ $t('app.general.btn.cancel') }}</app-btn>
          <app-btn color="primary" type="submit">{{ (user.created_on) ? $t('app.general.btn.save') : $t('app.general.btn.add') }}</app-btn>
        </v-card-actions>
      </v-card>
    </v-form>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'
import { AppUser } from '@/store/auth/types'

@Component({})
export default class UserConfigDialog extends Vue {
  @Prop({ type: Boolean, required: true })
  value!: boolean

  @Prop({ type: Object, required: true })
  user!: AppUser

  valid = false

  rules = {
    required: (v: string) => (v !== undefined && v !== '') || this.$t('app.general.simple_form.error.required'),
    password: (v: string) => (v.toLowerCase() !== this.user.username.toLowerCase()) || this.$t('app.general.simple_form.error.password_username'),
    min: (v: string) => (v !== undefined && v.length >= 4) || this.$t('app.general.simple_form.error.min', { min: 4 }),
    max: (v: string) => (v !== undefined && v.length <= 60) || this.$t('app.general.simple_form.error.max', { max: 60 })
  }

  handleSave () {
    if (this.valid) {
      this.$emit('save', this.user)
      this.$emit('input', false)
    }
  }
}
</script>
