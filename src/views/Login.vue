<template>
  <v-row
    class="login-shell"
    justify="center"
    align="center"
  >
    <v-col
      class="login-column"
      cols="12"
    >
      <v-card class="login-card">
        <v-form
          @submit.prevent="handleLogin"
        >
          <div class="login-head">
            <span class="muon-wordmark">MUON3D</span>
            <span class="login-head__tag">Printer sign-in</span>
          </div>

          <div class="login-body">
            <h1 class="login-title">
              {{ $t('app.general.btn.login') }}
            </h1>
            <p class="login-note">
              This account belongs to this printer. It is not a Muon3D cloud account.
            </p>

            <v-alert
              v-if="error"
              type="error"
              text
              dense
              class="mb-4"
            >
              {{ $t('app.general.simple_form.error.credentials') }}
            </v-alert>

            <v-text-field
              v-model="username"
              :label="$t('app.general.label.username')"
              autocomplete="username"
              spellcheck="false"
              outlined
              dense
              hide-details="auto"
              :disabled="loading"
              class="mb-3"
            />

            <v-text-field
              v-model="password"
              :label="$t('app.general.label.password')"
              autocomplete="current-password"
              outlined
              dense
              type="password"
              hide-details="auto"
              :disabled="loading"
              class="mb-3"
            />

            <v-select
              v-if="availableSources.length > 1"
              v-model="source"
              :label="$t('app.general.label.auth_source')"
              outlined
              dense
              hide-details="auto"
              :disabled="loading"
              :items="availableSources.map(value => ({ text: $t(`app.general.label.${value}`), value }))"
              class="mb-3"
            />

            <app-btn
              type="submit"
              color="primary"
              :loading="loading"
              :disabled="loading"
              block
              class="login-submit"
            >
              {{ $t('app.general.btn.login') }}
            </app-btn>
          </div>

          <div class="login-links">
            <a
              :href="$globals.DOCS_AUTH_LOST_PASSWORD"
              target="_blank"
              rel="noopener"
            >
              {{ $t('app.general.btn.forgot_password') }}
            </a>
            <a
              :href="$globals.DOCS_AUTH"
              target="_blank"
              rel="noopener"
            >
              {{ $t('app.general.btn.auth_unsure') }}
            </a>
          </div>
        </v-form>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { appInit } from '@/init'
import { consola } from 'consola'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'

@Component({})
export default class Login extends Vue {
  username = ''
  password = ''
  error = false
  loading = false
  source = 'moonraker'
  availableSources = [this.source]

  async mounted () {
    // A cloud printer has no Moonraker login, and muon-link refuses
    // /access/* to every remote role: asking only raised "Server error".
    if (isManagedApiUrl(this.$store.state.config.apiUrl)) return
    const authInfo = await this.$store.dispatch('auth/getAuthInfo')
    this.source = authInfo.defaultSource ?? this.source
    this.availableSources = authInfo.availableSources ?? this.availableSources
  }

  async handleLogin () {
    if (isManagedApiUrl(this.$store.state.config.apiUrl)) return
    this.error = false
    this.loading = true
    try {
      await this.$store.dispatch('auth/login', { username: this.username, password: this.password, source: this.source })
    } catch (err) {
      this.error = true
    }
    this.loading = false

    // Re-init the app.
    if (!this.error) {
      const instance = this.$store.getters['config/getCurrentInstance']

      const config = await appInit(instance, this.$store.state.config.hostConfig)

      // Reconnect the socket with the new instance url.
      if (config.apiConnected && config.apiAuthenticated) {
        consola.debug('Activating socket with config', config)
        this.$socket.connect(config.apiConfig.socketUrl)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .login-shell {
    min-height: min(640px, 100%);
    padding: 24px 0;
  }

  .login-column {
    max-width: 400px;
  }

  .login-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-bottom: 1px solid var(--m3d-border);
  }

  .login-head__tag {
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono);
    font-size: 0.6875rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .login-body {
    padding: 24px;
  }

  .login-title {
    margin: 0 0 4px;
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .login-note {
    margin: 0 0 20px;
    color: var(--m3d-text-muted);
    font-size: 0.8125rem;
    line-height: 1.5;
  }

  .login-submit {
    height: 40px !important;
    margin-top: 8px;
  }

  .login-links {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px 24px;
    border-top: 1px solid var(--m3d-border);
    font-size: 0.8125rem;
  }

  .login-links a {
    color: var(--m3d-text-muted);
    text-decoration: none;
  }

  .login-links a:hover {
    color: var(--m3d-accent);
  }
</style>
