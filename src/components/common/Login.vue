<template>
  <v-container
    fluid
    class="fill-height"
  >
    <v-row
      :dense="$vuetify.breakpoint.smAndDown"
      justify="center"
      align="center"
    >
      <v-col
        cols="12"
        md="4"
        lg="3"
        xl="2"
      >
        <v-form
          @submit.prevent="handleLogin"
        >
          <div class="text-center">
            <p v-safe-html="$t('app.general.msg.welcome_back')" />

            <v-alert
              v-if="error"
              type="error"
            >
              {{ $t('app.general.simple_form.error.credentials') }}
            </v-alert>

            <v-text-field
              v-model="username"
              :label="$t('app.general.label.username')"
              autocomplete="username"
              spellcheck="false"
              filled
              dense
              hide-details="auto"
              :disabled="loading"
              class="mb-4"
            />

            <v-text-field
              v-model="password"
              :label="$t('app.general.label.password')"
              autocomplete="current-password"
              filled
              dense
              type="password"
              hide-details="auto"
              :disabled="loading"
              class="mb-4"
            />

            <v-select
              v-if="availableSources.length > 1"
              v-model="source"
              :label="$t('app.general.label.auth_source')"
              filled
              dense
              hide-details="auto"
              :disabled="loading"
              :items="availableSources.map(value => ({ text: $t(`app.general.label.${value}`), value }))"
              class="mb-4"
            />

            <app-btn
              type="submit"
              :disabled="loading"
              large
              block
              class="mb-6"
            >
              <v-icon
                v-if="loading"
                class="spin mr-2"
              >
                $loading
              </v-icon>
              {{ $t('app.general.btn.login') }}
            </app-btn>

            <app-btn
              plain
              class="custom-transform-class text-none"
              :href="$globals.DOCS_AUTH_LOST_PASSWORD"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ $t('app.general.btn.forgot_password') }}
            </app-btn>

            <app-btn
              plain
              class="custom-transform-class text-none"
              :href="$globals.DOCS_AUTH"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ $t('app.general.btn.auth_unsure') }}
            </app-btn>
          </div>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { consola } from 'consola'
import { SocketActions } from '@/api/socketActions'
import StateMixin from '@/mixins/state'

@Component({})
export default class Login extends Mixins(StateMixin) {
  username = ''
  password = ''
  error = false
  loading = false
  source = 'moonraker'
  availableSources = [this.source]

  async mounted () {
    try {
      this.$typedCommit('config/setLayoutMode', false)

      const authInfo = await SocketActions.accessInfo()

      if (authInfo.available_sources != null) {
        this.availableSources = authInfo.available_sources
      }
      if (authInfo.default_source != null) {
        this.source = authInfo.default_source
      }
    } catch (e) {
      consola.debug('accessInfo on Login mount failed', e)
    }
  }

  async handleLogin () {
    this.error = false
    this.loading = true
    try {
      await this.$typedDispatch('auth/login', {
        username: this.username,
        password: this.password,
        source: this.source
      })
    } catch {
      this.error = true
    }
    this.loading = false
  }
}
</script>
