<template>
  <div>
    <v-subheader id="auth">
      {{ $t('app.setting.title.authentication') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting>
        <app-btn
          outlined
          small
          color="primary"
          class="mr-2"
          @click="handleApiKeyDialog"
        >
          <v-icon
            small
            left
          >
            $edit
          </v-icon>
          {{ $t('app.general.label.api_key') }}
        </app-btn>

        <app-btn
          outlined
          small
          color="primary"
          @click="handleAddUserDialog"
        >
          <v-icon
            small
            left
          >
            $plus
          </v-icon>
          {{ $t('app.setting.btn.add_user') }}
        </app-btn>
      </app-setting>

      <v-divider v-if="users.length > 0" />

      <template
        v-for="(user, i) in users"
      >
        <app-setting
          :key="`user-${user.username}`"
          :sub-title="
            user.username === currentUser ? $t('app.general.label.current_user') :
            user.source !== 'moonraker' ? $t('app.general.label.user_managed_source', { source: $t(`app.general.label.${user.source}`) }) :
            undefined
          "
          :r-cols="3"
        >
          <template #title>
            {{ user.username }}
          </template>

          <app-btn
            :disabled="user.username === currentUser || user.source !== 'moonraker'"
            icon
            @click.stop="handleRemoveUser(user)"
          >
            <v-icon dense>
              $delete
            </v-icon>
          </app-btn>
        </app-setting>

        <v-divider
          v-if="i < users.length - 1"
          :key="`divider-${user.username}`"
        />
      </template>

      <add-user-dialog
        v-if="addUserDialogOpen"
        v-model="addUserDialogOpen"
        @save="handleSaveUser"
      />

      <api-key-dialog
        v-if="apiKeyDialogOpen"
        v-model="apiKeyDialogOpen"
      />
    </v-card>
  </div>
</template>

<script lang="ts">
import type { AppUser } from '@/store/auth/types'
import { Component, Vue } from 'vue-property-decorator'
import AddUserDialog from './AddUserDialog.vue'
import ApiKeyDialog from './ApiKeyDialog.vue'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: {
    AddUserDialog,
    ApiKeyDialog
  }
})
export default class AuthSettings extends Vue {
  search = ''
  categoryId?: string = undefined
  addUserDialogOpen = false
  apiKeyDialogOpen = false

  get users (): AppUser[] {
    return this.$typedState.auth.users
  }

  get currentUser () {
    const currentUser: AppUser | null = this.$typedState.auth.currentUser

    return currentUser?.username ?? ''
  }

  handleAddUserDialog () {
    this.addUserDialogOpen = true
  }

  handleApiKeyDialog () {
    this.apiKeyDialogOpen = true
  }

  async handleRemoveUser (user: AppUser) {
    const result = await this.$confirm(
      this.$t('app.general.simple_form.msg.confirm_remove_user', { username: user.username }).toString(),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      await SocketActions.accessDeleteUser(user.username)
    }
  }

  async handleSaveUser (user: { username: string, password: string }) {
    const isFirstUser = this.users.length === 0

    await SocketActions.accessPostUser(user.username, user.password)

    if (isFirstUser) {
      this.$typedDispatch('auth/checkTrust')
    }
  }
}
</script>
