<template>
  <v-text-field
    v-model="inputValue"
    v-bind="$attrs"
    class="app-text-field"
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
            text
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

@Component({
  inheritAttrs: false
})
export default class AppTextFieldWithCopy extends Vue {
  @VModel()
  inputValue!: unknown

  hasCopied = false

  handleCopy () {
    if (
      this.inputValue &&
      navigator.clipboard
    ) {
      navigator.clipboard.writeText(this.inputValue.toString())

      this.hasCopied = true

      setTimeout(() => {
        this.hasCopied = false
      }, 2000)
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
