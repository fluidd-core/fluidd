<template>
  <div>
    <slot
      :pending="pending"
      :result="result"
      :error="error"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'

@Component({})
export default class StatusCard extends Vue {
  pending = false
  error: unknown = null
  result: unknown = null

  @Prop({ type: Promise })
  readonly promise?: Promise<unknown> | null

  @Watch('promise')
  onPromiseChanged () {
    this.evaluatePromise()
  }

  async evaluatePromise () {
    const promise = this.promise

    if (!promise) {
      this.setPromiseResults(null, null, null)

      return
    }

    this.pending = true

    try {
      const result = await promise

      this.setPromiseResults(promise, result, null)
    } catch (error) {
      this.setPromiseResults(promise, null, error)
    }
  }

  setPromiseResults (promise: Promise<unknown> | null, result: unknown, error: unknown) {
    if (!promise || this.promise === promise) {
      this.error = error
      this.result = result
      this.pending = false
    }
  }

  mounted () {
    this.evaluatePromise()
  }
}
</script>
