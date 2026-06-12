<template>
  <app-dialog
    v-model="open"
    :title="$t('app.general.label.add_user')"
    :save-button-text="$t('app.general.btn.add')"
    max-width="500"
    @save="handleSave"
  >
    <v-card-text class="pa-0">
      <app-setting :title="$t('app.general.label.name')">
        <v-text-field
          v-model="username"
          autocomplete="username"
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
          v-model="password"
          filled
          dense
          type="password"
          class="mt-0"
          hide-details="auto"
          :rules="[
            $rules.required,
            $rules.lengthGreaterThanOrEqual(4),
            $rules.passwordNotEqualUsername(username)
          ]"
        />
      </app-setting>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Vue, VModel } from 'vue-property-decorator'

@Component({})
export default class AddUserDialog extends Vue {
  @VModel({ type: Boolean })
  open?: boolean

  username: string = ''
  password: string = ''

  handleSave () {
    this.$emit('save', {
      username: this.username,
      password: this.password
    })

    this.open = false
  }
}
</script>
