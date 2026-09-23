import type { DispatchOptions } from 'vuex'
import type { socket } from './socket'
import type { server } from './server'
import type { printer } from './printer'
import type { config } from './config'
import type { files } from './files'
import type { charts } from './charts'
import type { console } from './console'
import type { macros } from './macros'
import type { power } from './power'
import type { history } from './history'
import type { version } from './version'
import type { gcodePreview } from './gcodePreview'
import type { layout } from './layout'
import type { mesh } from './mesh'
import type { notifications } from './notifications'
import type { announcements } from './announcements'
import type { auth } from './auth'
import type { timelapse } from './timelapse'
import type { wait } from './wait'
import type { webcams } from './webcams'
import type { jobQueue } from './jobQueue'
import type { spoolman } from './spoolman'
import type { mmu } from './mmu'
import type { sensors } from './sensors'
import type { database } from './database'
import type { analysis } from './analysis'
import type { afc } from './afc'
import type { storeOptions } from '.'

// Deliberately spelled out rather than derived from `storeOptions.modules`: those
// options are annotated `satisfies StoreOptions<RootState>`, so deriving the list
// from them would close a cycle and collapse every type below to `any`.
type RootModulesType = {
  socket: typeof socket,
  auth: typeof auth,
  server: typeof server,
  printer: typeof printer,
  config: typeof config,
  files: typeof files,
  layout: typeof layout,
  charts: typeof charts,
  console: typeof console,
  macros: typeof macros,
  power: typeof power,
  history: typeof history,
  version: typeof version,
  mesh: typeof mesh,
  notifications: typeof notifications,
  announcements: typeof announcements,
  wait: typeof wait,
  gcodePreview: typeof gcodePreview,
  timelapse: typeof timelapse,
  webcams: typeof webcams,
  jobQueue: typeof jobQueue,
  spoolman: typeof spoolman,
  mmu: typeof mmu,
  sensors: typeof sensors,
  database: typeof database,
  analysis: typeof analysis,
  afc: typeof afc
}

type RootStateType<TModules> = {
  [K in keyof TModules]: TModules[K] extends { state: infer S }
    ? S extends (...args: any[]) => infer R ? R : S
    : never
}

type RootGettersType<TModules, TOptions> = UnionToIntersection<{
  [K in keyof TModules]: GettersOf<TModules[K], K>
}[keyof TModules] | GettersOf<TOptions, never>>

type RootMutationsType<TModules, TOptions> = UnionToIntersection<{
  [K in keyof TModules]: MutationsOf<TModules[K], K>
}[keyof TModules] | MutationsOf<TOptions, never>>

type RootActionsType<TModules, TOptions> = UnionToIntersection<{
  [K in keyof TModules]: ActionsOf<TModules[K], K>
}[keyof TModules] | ActionsOf<TOptions, never>>

type GettersOf<TModule, K> = TModule extends { getters: infer G }
  ? {
      [U in keyof G as ModuleKey<TModule, K, U>]: G[U] extends (...args: any[]) => infer R ? R : never
    }
  : never

type MutationsOf<TModule, K> = TModule extends { mutations: infer M }
  ? {
      [U in keyof M]: M[U] extends (state: any, ...args: infer P) => void
        ? (type: ModuleKey<TModule, K, U>, ...args: P) => void
        : never
    }[keyof M]
  : never

type ActionsOf<TModule, K> = TModule extends { actions: infer M }
  ? {
      [U in keyof M]: M[U] extends (store: any, ...args: infer P) => infer R
        ? (type: ModuleKey<TModule, K, U>, ...args: DispatchArgs<P>) => R
        : never
    }[keyof M]
  : never

// The root store's own getters, mutations and actions are reached unprefixed.
type ModuleKey<TModule, K, U> = TModule extends { namespaced: true }
  ? `${string & K}/${string & U}`
  : `${string & U}`

type DispatchArgs<P extends any[]> = P extends []
  ? [payload?: undefined, options?: DispatchOptions]
  : [payload: P[0], options?: DispatchOptions]

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export interface RootModules extends RootModulesType {
}

export interface RootState extends RootStateType<RootModulesType> {
}

export interface RootGetters extends RootGettersType<RootModulesType, typeof storeOptions> {
}

export interface RootMutations extends RootMutationsType<RootModulesType, typeof storeOptions> {
}

export interface RootActions extends RootActionsType<RootModulesType, typeof storeOptions> {
}
