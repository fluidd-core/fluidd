<template>
  <div
    id="library"
    class="lib-set"
    data-tid="library-settings"
  >
    <div class="lib-set__titles">
      <h2>Library</h2>
      <p>These follow your account, so they're the same in Fluidd, Slice and the app on every device.</p>
    </div>

    <!-- Signed out: the Library is the account's. -->
    <section
      v-if="!signedIn"
      class="lib-empty lib-surface"
      data-tid="library-settings-signed-out"
    >
      <span class="lib-empty__icon"><frame-icon
        name="user"
        large
      /></span>
      <h2>Sign in to keep a Library</h2>
      <p>
        Your Library keeps the prints you save in Slice in your Muon3D account, so you can print them again on any of
        your printers.
      </p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="library-sign-in"
          @click="accountDialog = true"
        >
          Sign in
        </button>
      </div>
    </section>

    <section
      v-else-if="!state.checked"
      class="lib-empty lib-surface"
    >
      <p>{{ state.error || 'Reading your Library…' }}</p>
      <div
        v-if="state.error"
        class="lib-empty__actions"
      >
        <button
          type="button"
          class="lib-btn"
          @click="refresh"
        >
          Try again
        </button>
      </div>
    </section>

    <!-- Not turned on: the promise, and turning it on (the consent names that promise's version). -->
    <section
      v-else-if="!state.enabled"
      class="lib-surface lib-set__card lib-set__off"
      data-tid="library-settings-off"
    >
      <div class="lib-set__off-head">
        <span class="lib-empty__icon lib-empty__icon--accent"><frame-icon
          name="library"
          large
        /></span>
        <div>
          <b>Your Library is off</b>
          <span>Turn it on to keep the prints you slice, and print them again on any of your printers.</span>
        </div>
      </div>
      <p
        v-if="purgeDay"
        class="lib-set__warn"
        data-tid="library-purge"
      >
        What was in it is deleted on {{ purgeDay }} unless you turn it back on.
      </p>
      <div
        v-if="promise"
        class="lib-set__promise"
      >
        <b>{{ promiseTitle }}</b>
        <ul>
          <li
            v-for="line in promise.lines"
            :key="line"
          >
            {{ line }}
          </li>
        </ul>
        <a
          :href="promiseUrl"
          target="_blank"
          rel="noopener"
        >What we read and keep, in full</a>
      </div>
      <p v-else>
        The Library has a promise this version of Control cannot show. Update Control before turning it on.
      </p>
      <p
        v-if="error"
        class="lib-set__error"
      >
        {{ error }}
      </p>
      <div>
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          :disabled="busy || !promise"
          data-tid="library-turn-on"
          @click="turnOn"
        >
          Turn on the Library
        </button>
      </div>
    </section>

    <template v-else>
      <section
        class="lib-surface lib-set__card lib-set__list"
        aria-label="Saving"
        data-tid="library-settings-on"
      >
        <div class="lib-set__row">
          <div class="lib-set__label">
            <b>Save every slice</b>
            <span>Each slice saves a new version of its print, without asking. Off: press Save, or say yes when asked.</span>
          </div>
          <toggle-switch
            :value="preference('autosave')"
            label="Save every slice"
            :disabled="!state.preferences || busy"
            data-tid="library-autosave"
            @input="setPreference('autosave', $event)"
          />
        </div>
        <div class="lib-set__row">
          <div class="lib-set__label">
            <b>Ask after slicing something new</b>
            <span>{{ preference('autosave') ? 'Not while every slice is saved.' : 'The "Keep this in your Library?" card. "Never ask" turns this off; turn it back on here.' }}</span>
          </div>
          <toggle-switch
            :value="preference('ask')"
            label="Ask after slicing something new"
            :disabled="!state.preferences || busy"
            data-tid="library-ask"
            @input="setPreference('ask', $event)"
          />
        </div>
        <div class="lib-set__row">
          <div class="lib-set__label">
            <b>Offer it when you print</b>
            <span>Adds "Keep in my Library", ticked, to the print check for anything not saved yet.</span>
          </div>
          <toggle-switch
            :value="preference('save_from_print_check')"
            label="Offer it when you print"
            :disabled="!state.preferences || busy"
            data-tid="library-print-check"
            @input="setPreference('save_from_print_check', $event)"
          />
        </div>
      </section>

      <section
        class="lib-surface lib-set__card"
        aria-label="Storage"
      >
        <div class="lib-set__storage-head">
          <h3 class="lib-card-title">
            Storage
          </h3>
          <span data-tid="library-storage"><b>{{ usedText }}</b> <span class="lib-set__muted">{{ quotaText }}</span></span>
        </div>
        <div
          class="lib-bar lib-set__bar"
          role="meter"
          aria-label="Library storage used"
          :aria-valuenow="usedPercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <i
            :class="{ 'lib-set__bar--full': usedPercent >= 90 }"
            :style="{ width: `${usedPercent}%` }"
          />
        </div>
        <router-link
          to="/library"
          class="lib-set__link"
        >
          Open your Library
        </router-link>
      </section>

      <section
        class="lib-surface lib-set__card lib-set__list"
        aria-label="Your data"
      >
        <div class="lib-set__row">
          <div class="lib-set__label">
            <b>Turn the Library off</b>
            <span>Saving stops at once. Everything is deleted after 30 days unless you turn it back on.</span>
          </div>
          <button
            type="button"
            class="lib-btn lib-btn--sm lib-btn--dng"
            :disabled="busy"
            data-tid="library-turn-off"
            @click="turnOff"
          >
            Turn off
          </button>
        </div>
      </section>
      <p
        v-if="error"
        class="lib-set__error"
      >
        {{ error }}
      </p>
    </template>

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import { describeLibraryError, type Preferences } from '@/services/library/api'
import { bytesText, dayText } from '@/services/library/format'
import { libraryPromise, PROMISE_TITLE, PROMISE_URL } from '@/services/library/promise'
import {
  libraryState,
  refreshLibrary,
  setLibraryPreferences,
  turnLibraryOff,
  turnLibraryOn,
  watchLibraryAccount
} from '@/services/library/store'

type Switch = 'autosave' | 'ask' | 'save_from_print_check'

/**
 * Settings › Library: the account's Library, the same on every printer.
 * Signed out, it says why it needs the account; off, it shows the promise
 * and turns it on (the consent names that promise's version); on, the
 * three switches, the storage used, and turning it off, which deletes
 * everything after 30 days unless it is turned on again.
 */
@Component({ components: { ToggleSwitch, CloudAccountDialog } })
export default class LibrarySettings extends Vue {
  busy = false
  error = ''
  accountDialog = false

  promiseTitle = PROMISE_TITLE
  promiseUrl = PROMISE_URL

  get promise () {
    return libraryState.checked ? libraryPromise(libraryState.promiseVersion) : null
  }

  created () {
    watchLibraryAccount()
    this.refresh()
  }

  get state () {
    return libraryState
  }

  get signedIn (): boolean {
    return libraryState.account !== null
  }

  get purgeDay (): string {
    return dayText(libraryState.purgeAfter)
  }

  get usedText (): string {
    return libraryState.usedBytes === null ? 'Reading…' : bytesText(libraryState.usedBytes)
  }

  get quotaText (): string {
    return libraryState.quotaBytes ? `of ${bytesText(libraryState.quotaBytes)}` : ''
  }

  get usedPercent (): number {
    const used = libraryState.usedBytes ?? 0
    const quota = libraryState.quotaBytes ?? 0
    return quota > 0 ? Math.min(100, Math.round((used / quota) * 100)) : 0
  }

  preference (name: Switch): boolean {
    return libraryState.preferences?.[name] === true
  }

  refresh () {
    refreshLibrary().catch(() => {})
  }

  async run (what: () => Promise<void>) {
    this.busy = true
    this.error = ''
    try {
      await what()
    } catch (error) {
      this.error = describeLibraryError(error)
    } finally {
      this.busy = false
    }
  }

  setPreference (name: Switch, value: boolean) {
    const patch: Partial<Preferences> = { [name]: value }
    return this.run(() => setLibraryPreferences(patch))
  }

  turnOn () {
    const version = this.promise?.version
    if (version) return this.run(() => turnLibraryOn(version))
  }

  async turnOff () {
    const ok = await this.$confirm('Saving stops at once, and everything in your Library is deleted after 30 days unless you turn it back on. Each printer keeps the files it already has.', {
      title: 'Turn the Library off?',
      buttonTrueText: 'Turn off',
      danger: true
    })
    if (!ok) return
    await this.run(turnLibraryOff)
  }
}
</script>

<style lang="scss" scoped>
  .lib-set {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 820px;
    color: var(--m3d-text);
  }

  .lib-set__titles {
    display: flex;
    flex-direction: column;
    gap: 4px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .lib-set__card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 18px;
  }

  .lib-set__list {
    gap: 0;
    padding: 0 18px;
  }

  .lib-set__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    padding: 14px 0;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .lib-set__label {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    b {
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .lib-set__storage-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    font-variant-numeric: tabular-nums;
  }

  .lib-set__muted {
    color: var(--m3d-text-muted);
  }

  .lib-set__bar {
    height: 10px;
    border-radius: 5px;
  }

  .lib-set__bar--full {
    background: var(--m3d-warning) !important;
  }

  .lib-set__link {
    align-self: flex-start;
    color: var(--m3d-accent) !important;
    font-size: 13px;
    text-decoration: none;
  }

  .lib-set__off-head {
    display: flex;
    align-items: center;
    gap: 14px;

    div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .lib-set__promise {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 14px 16px;
    border-radius: 9px;
    background: var(--m3d-surface-2);
    font-size: 14px;

    ul {
      margin: 0;
      padding-left: 18px;
      color: var(--m3d-text-muted);
    }

    a {
      color: var(--m3d-accent) !important;
      font-size: 13px;
      text-decoration: none;
    }
  }

  .lib-set__warn {
    margin: 0;
    color: var(--m3d-warning);
    font-size: 13px;
  }

  .lib-set__error {
    margin: 0;
    color: var(--m3d-danger);
    font-size: 13px;
  }

  @media (max-width: 600px) {
    .lib-set__row {
      gap: 14px;
    }

    .lib-set__titles h2 {
      font-size: 20px;
    }
  }
</style>
