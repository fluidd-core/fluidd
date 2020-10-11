import { merge } from 'lodash-es'

/**
 * A very simple cache and rate limiter for socket notifications.
 */
export class RateLimiter {
  resolver: Function | undefined = undefined
  timeout = 0
  timer = -1
  fetchDate = 0
  private cache: any = {}

  constructor (timeout: number) {
    this.timeout = timeout
  }

  create (resolver: Function) {
    this.resolver = resolver
    this.resetCache()

    return (...args: any[]) => {
      if (
        this.isCacheExpired() &&
        this.resolver
      ) {
        resolver = this.resolver
        for (const o in this.cache) {
          // console.log('resolving', this.cache[o])
          resolver(...this.cache[o])
          delete this.cache[o]
        }
        this.resetCache()
      } else {
        this.addCacheItem(args[0], args)
      }
    }
  }

  isCacheExpired () {
    return (this.fetchDate + this.timeout) < new Date().getTime()
  }

  resetCache () {
    this.fetchDate = new Date().getTime()
  }

  addCacheItem (key: string, args: any) {
    if (!this.cache[key]) this.cache[key] = []
    merge(this.cache[key], args)
    // console.log('add cache item', key, args)
  }
}

export interface RateLimiter {
  create(resolver: Function): Function;
}
