class AbortControllerWithTimeout extends AbortController {
  private timeout: ReturnType<typeof setTimeout>

  constructor (ms: number) {
    super()
    this.timeout = setTimeout(() => this.abort(new Error('Timeout')), ms)
  }

  abort (reason?: unknown): void {
    clearTimeout(this.timeout)
    super.abort(reason)
  }

  clear (): void {
    clearTimeout(this.timeout)
  }
}

const abortControllerWithTimeout = (ms: number) => new AbortControllerWithTimeout(ms)

export default abortControllerWithTimeout
