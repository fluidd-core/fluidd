<template>
  <v-text-field
    v-model="inputValue"
    class="app-text-field"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <template #append-outer>
      <v-tooltip
        :close-delay="hasCopied ? 2000 : undefined"
        :open-on-focus="false"
        bottom
      >
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            icon
            class="btn-copy"
            @click="handleCopy"
            v-on="on"
          >
            <v-fade-transition leave-absolute>
              <v-icon
                :key="hasCopied"
                dense
                class="icon-copy"
              >
                {{ hasCopied ? '$check' : '$contentCopy' }}
              </v-icon>
            </v-fade-transition>
          </app-btn>
        </template>
        <span>{{ hasCopied ? $t('app.general.btn.copied') : $t('app.general.btn.copy') }}</span>
      </v-tooltip>
    </template>
  </v-text-field>
</template>

<script lang="ts">
import { Component, VModel, Vue } from 'vue-property-decorator'
import clipboardCopy from '@/util/clipboard-copy'
import sleep from '@/util/sleep'

@Component({
  inheritAttrs: false
})
export default class AppTextFieldWithCopy extends Vue {
  @VModel()
  inputValue!: unknown

  hasCopied = false
  abortController: AbortController | null = null

  async handleCopy () {
    if (this.inputValue) {
      if (await clipboardCopy(this.inputValue.toString(), this.$el)) {
        this.abortController?.abort()

        this.hasCopied = true

        try {
          const abortController = this.abortController = new AbortController()

          await sleep(2000, abortController.signal)

          this.hasCopied = false
        } catch {}
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .app-text-field {
    .btn-copy {
      margin-top: -8px;
      margin-right: -2px;
    }

    .icon-copy {
      position: absolute;
    }
  }
</style>
