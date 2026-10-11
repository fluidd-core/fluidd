<!--
  The console's sign-in page (WEB-12, muon-link-cloud#15).

  `/authorize` sends a browser with no console session here, with `continue`
  set to the `/authorize?...` it came from. This page signs the person in,
  turns that into the console's browser session with a handoff
  (`POST /v1/handoff`, then `GET /handoff?code=&next=`), and the console
  carries on to `continue`, which now finds a session and returns to the
  surface that asked.

  `continue` is followed only if it begins `/authorize?` (`safeContinue`).
  Anything else, or none, still signs in, and then asks `/authorize` itself
  for this page, so the person lands signed in to Fluidd.

  The password session made here is only ever used for the handoff; it is
  not kept by this page.
-->
<template>
  <div class="muon-sign-in">
    <v-card
      max-width="420"
      class="mx-auto pa-2"
    >
      <v-card-title class="pb-1">
        {{ mode === 'sign-in' ? 'Sign in to Muon3D' : 'Create your Muon3D account' }}
      </v-card-title>
      <v-card-subtitle class="pt-1">
        One account for your printers, the slicer and your models.
      </v-card-subtitle>

      <v-card-text>
        <v-alert
          v-if="notice"
          type="info"
          dense
          text
          data-tid="sign-in-notice"
        >
          {{ notice }}
        </v-alert>
        <v-form
          ref="form"
          @submit.prevent="submit"
        >
          <v-text-field
            v-if="mode === 'sign-up'"
            v-model="name"
            label="Name"
            autocomplete="name"
            outlined
            dense
          />
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            autocomplete="email"
            outlined
            dense
            autofocus
          />
          <v-text-field
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="mode === 'sign-in' ? 'current-password' : 'new-password'"
            :hint="mode === 'sign-up' ? 'At least 8 characters' : ''"
            outlined
            dense
          />
          <v-alert
            v-if="error"
            type="error"
            dense
            text
            class="mb-3"
            data-tid="sign-in-error"
          >
            {{ error }}
          </v-alert>
          <app-btn
            type="submit"
            color="primary"
            block
            :loading="busy"
          >
            {{ mode === 'sign-in' ? 'Sign in' : 'Create account' }}
          </app-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center pb-4">
        <span class="text-body-2 text--secondary">
          {{ mode === 'sign-in' ? 'New to Muon3D?' : 'Already have an account?' }}
        </span>
        <v-btn
          text
          small
          color="primary"
          @click="mode = mode === 'sign-in' ? 'sign-up' : 'sign-in'; error = null"
        >
          {{ mode === 'sign-in' ? 'Create an account' : 'Sign in' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { cloudApi, CloudError } from '@/services/muon-cloud/api'
import { handoffUrl, prepareAuthorize, safeContinue } from '@/services/muon-cloud/centralLogin'

@Component({})
export default class SignIn extends Vue {
  mode: 'sign-in' | 'sign-up' = 'sign-in'
  name = ''
  email = ''
  password = ''
  showPassword = false
  busy = false
  error: string | null = null

  /** Where the console carries on after the handoff, if it is one it may. */
  get continuePath (): string | null {
    return safeContinue(this.$route.query.continue)
  }

  get notice (): string | null {
    if (this.$route.query.error === 'handoff_expired') return 'That sign-in took too long to finish. Sign in again.'
    return null
  }

  /** Overridable in tests: a full-page navigation. */
  go (url: string) {
    window.location.assign(url)
  }

  async submit () {
    this.error = null
    this.busy = true
    try {
      const { token } = this.mode === 'sign-in'
        ? await cloudApi.signInFor(this.email, this.password)
        : await cloudApi.signUpFor(this.email, this.password, this.name)
      this.password = ''
      // With no `continue` to follow, ask /authorize for this page itself,
      // so the handoff ends with Fluidd signed in.
      let next = this.continuePath
      if (!next) {
        const url = new URL(await prepareAuthorize({ silent: false, returnTo: '/' }))
        next = `${url.pathname}${url.search}`
      }
      const handoff = await cloudApi.handoff(token)
      this.go(handoffUrl(handoff.url, next))
    } catch (error) {
      this.busy = false
      this.error = error instanceof CloudError && error.status === 403
        ? 'This account uses two-step sign-in. Sign in with the Muon3D app for now.'
        : (error as Error).message
    }
  }
}
</script>

<style lang="scss" scoped>
.muon-sign-in {
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 16px;
}
</style>
