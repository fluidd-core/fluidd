<template>
  <v-dialog
    v-model="open"
    max-width="420"
  >
    <v-card class="muon-cloud-dialog">
      <v-card-title class="pb-1">
        {{ mode === 'sign-in' ? 'Sign in to Muon3D' : 'Create your Muon3D account' }}
      </v-card-title>
      <v-card-subtitle class="pt-1">
        Reach your linked printers from anywhere. Printers on this network keep working without an account.
      </v-card-subtitle>

      <v-card-text v-if="redirecting">
        Taking you to the Muon3D sign-in…
      </v-card-text>

      <v-card-text v-else>
        <v-form
          ref="form"
          @submit.prevent="submit"
        >
          <v-text-field
            v-if="mode === 'sign-up'"
            v-model="name"
            label="Name"
            autocomplete="name"
            autofocus
            outlined
            dense
          />
          <v-text-field
            v-if="mode === 'sign-up'"
            v-model="age"
            label="Your age"
            type="text"
            inputmode="numeric"
            hint="Private. Confirm once; accounts require age 13 or over."
            persistent-hint
            outlined
            dense
            data-tid="sign-up-age"
            :aria-describedby="ageError ? 'dialog-sign-up-age-error' : undefined"
            :aria-invalid="ageError ? 'true' : undefined"
          />
          <p
            v-if="ageError"
            id="dialog-sign-up-age-error"
            class="error--text text-caption"
            data-tid="sign-up-age-error"
            role="alert"
          >
            {{ ageError }}
          </p>
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            autocomplete="email"
            outlined
            dense
            :autofocus="mode === 'sign-in'"
          />
          <v-text-field
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :autocomplete="mode === 'sign-in' ? 'current-password' : 'new-password'"
            :hint="mode === 'sign-up' ? 'At least 8 characters' : ''"
            :append-icon="showPassword ? icons.eyeOff : icons.eye"
            outlined
            dense
            @click:append="showPassword = !showPassword"
          />
          <v-alert
            v-if="error"
            type="error"
            dense
            text
            class="mb-3"
            role="alert"
            aria-live="assertive"
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

      <v-card-actions
        v-if="!redirecting"
        class="justify-center pb-4"
      >
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
  </v-dialog>
</template>

<script lang="ts">
import { Component, Prop, VModel, Vue } from 'vue-property-decorator'
import { signIn, signUp } from '@/services/muon-cloud/state'
import { centralLoginEnabled, startCentralSignIn } from '@/services/muon-cloud/centralLogin'

@Component({})
export default class CloudAccountDialog extends Vue {
  @VModel({ type: Boolean })
    open?: boolean

  @Prop({ type: String, default: 'sign-in' })
  readonly initialMode!: 'sign-in' | 'sign-up'

  mode: 'sign-in' | 'sign-up' = 'sign-in'
  age = ''
  name = ''
  email = ''
  password = ''
  showPassword = false
  busy = false
  error: string | null = null
  ageError = ''
  icons = { eye: '$eye', eyeOff: '$eyeOff' }

  redirecting = false

  created () {
    this.mode = this.initialMode
    // Served by the console, sign-in goes through its /authorize (WEB-12):
    // one sign-in for every Muon3D page, kept by the console's browser
    // session rather than by this page.
    if (centralLoginEnabled()) {
      this.redirecting = true
      startCentralSignIn({ silent: false }).catch((error) => {
        this.redirecting = false
        this.error = (error as Error).message
      })
    }
  }

  async submit () {
    this.error = null
    this.ageError = ''
    if (this.mode === 'sign-up') {
      this.ageError = validateAge(this.age)
      if (this.ageError) return
    }
    this.busy = true
    try {
      if (this.mode === 'sign-in') await signIn(this.email, this.password)
      else await signUp(this.email, this.password, this.name, Number(this.age))
      this.password = ''
      this.$emit('signed-in')
      this.open = false
    } catch (error) {
      this.error = (error as Error).message
    } finally {
      this.busy = false
    }
  }
}

function validateAge (age: string): string {
  if (!/^\d+$/.test(age)) return 'Enter your age as a whole number.'
  return Number(age) >= 13 && Number(age) <= 120 ? '' : 'Age must be between 13 and 120.'
}
</script>
