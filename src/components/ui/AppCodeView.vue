<template>
  <div class="code-view">
    <pre>{{ value }}</pre>

    <v-btn
      small
      fab text
      absolute
      v-blur
      @click="handleCopyClick"
    >
      <v-fade-transition mode="in-out" leave-absolute>
        <v-icon v-show="!copied" dense color="grey">$contentCopy</v-icon>
      </v-fade-transition>
      <v-fade-transition mode="in-out" leave-absolute>
        <v-icon v-show="copied" dense color="grey">$check</v-icon>
      </v-fade-transition>
    </v-btn>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  components: {}
})
export default class AppCodeView extends Vue {
  @Prop({ type: String, required: true })
  value!: string

  copied = false

  handleCopyClick () {
    if (
      navigator.clipboard &&
      this.value
    ) {
      navigator.clipboard.writeText(this.value)
      this.copied = true
      setTimeout(() => { this.copied = false }, 1200)
    }
  }
}
</script>

<style lang="scss" scoped>
  @import '~vuetify/src/styles/styles.sass';

  .code-view {
    position: relative;
    background-color: rgba(map-get($material-theme, 'bg-color'), 0.08);
    border: solid thin rgba(map-get($material-theme, 'bg-color'), 0.14);
    border-radius: 6px;
    min-height: 48px;

    pre {
      font-size: 1rem;
      white-space: pre-wrap;
      padding: 14px 16px;
      margin-right: 38px;
    }

    .v-btn {
      top: 6px;
      right: 6px;
    }
  }
</style>
