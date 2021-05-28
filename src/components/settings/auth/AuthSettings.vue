<template>
  <div>
    <v-subheader id="auth">{{ $t('app.setting.title.authentication') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">

      <app-setting>
        <app-btn
          outlined
          small
          color="primary"
          @click="handleApiKeyDialog"
          class="mr-2"
        >
          <v-icon small left>$edit</v-icon>
          {{ $t('app.general.label.api_key') }}
        </app-btn>

        <app-btn
          outlined
          small
          color="primary"
          @click="handleAddUserDialog"
        >
          <v-icon small left>$plus</v-icon>
          {{ $t('app.setting.btn.add_user') }}
        </app-btn>
      </app-setting>

      <v-divider v-if="users.length > 0" />

      <template
        v-for="(user, i) in users"
      >
        <app-setting
          :key="`user-${user.username}`"
          :r-cols="3"
        >
          <template v-slot:title>
            {{ user.username }}
          </template>

          <app-btn
            :disabled="user.username === currentUser"
            @click.stop="handleRemoveUser(user)"
            fab
            text
            x-small
            color="">
            <v-icon color="grey--text">$close</v-icon>
          </app-btn>

        </app-setting>

        <v-divider
          v-if="i < users.length - 1"
          :key="`divider-${user.username}`"
        />
      </template>

      <user-config-dialog
        v-if="userDialogState.open"
        v-model="userDialogState.open"
        :user="userDialogState.user"
        @save="userDialogState.handler"
      ></user-config-dialog>

      <api-key-dialog
        v-if="apiKeyDialogState.open"
        v-model="apiKeyDialogState.open"
      ></api-key-dialog>

    </v-card>
  </div>
</template>

<script lang="ts">
import { AppUser } from '@/store/auth/types'
import { Component, Vue } from 'vue-property-decorator'
import UserConfigDialog from './UserConfigDialog.vue'
import ApiKeyDialog from './ApiKeyDialog.vue'

@Component({
  components: {
    UserConfigDialog,
    ApiKeyDialog
  }
})
export default class AuthSettings extends Vue {
  search = ''
  categoryId: string | undefined = undefined

  userDialogState: any = {
    open: false,
    user: null,
    handler: null
  }

  apiKeyDialogState: any = {
    open: false
  }

  get users () {
    return this.$store.getters['auth/getUsers']
  }

  get currentUser () {
    const currentUser = this.$store.getters['auth/getCurrentUser']
    return (currentUser && currentUser.username) ? currentUser.username : ''
  }

  handleAddUserDialog () {
    this.userDialogState = {
      open: true,
      user: { username: '', password: '' },
      handler: this.handleSaveUser
    }
  }

  handleEditUserDialog (user: AppUser) {
    this.userDialogState = {
      open: true,
      user,
      handler: this.handleSaveUser
    }
  }

  handleApiKeyDialog () {
    this.apiKeyDialogState.open = true
  }

  handleRemoveUser (user: AppUser) {
    this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          this.$store.dispatch('auth/removeUser', user)
        }
      })
  }

  async handleSaveUser (user: AppUser) {
    await this.$store.dispatch('auth/addUser', user)

    // We only want to check trust if this is the first user being added.
    if (this.users.length === 0) this.$store.dispatch('auth/checkTrust')
  }
}
</script>
