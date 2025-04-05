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
import type { timelapse } from '@/store/timelapse'
import type { wait } from './wait'
import type { webcams } from './webcams'
import type { jobQueue } from './jobQueue'
import type { spoolman } from './spoolman'
import type { mmu } from './mmu'
import type { sensors } from './sensors'
import type { analysis } from './analysis'
import type { storeOptions } from '.'

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
  analysis: typeof analysis
}

type RootStateType = {
  [K in keyof RootModulesType]: RootModulesType[K] extends { state: infer U } ? U : never
}

type RootGettersType = UnionToIntersection<{
  [K in keyof RootModulesType]: RootModulesType[K] extends { getters: infer G }
    ? {
        [U in keyof G as `${string & K}/${string & U}`]: G[U] extends (...args: any[]) => infer R ? R : never
      }
    : never
}[keyof RootModulesType]>

type RootMutationsType = UnionToIntersection<{
  [K in keyof RootModulesType]: RootModulesType[K] extends { mutations: infer M }
    ? {
        [U in keyof M]: M[U] extends (state: any, ...args: infer P) => void
          ? (type: `${string & K}/${string & U}`, ...args: P) => void
          : never
      }[keyof M]
    : never
}[keyof RootModulesType]>

type RootActionsType = UnionToIntersection<{
  [K in keyof RootModulesType]: RootModulesType[K] extends { actions: infer M }
    ? {
        [U in keyof M]: M[U] extends (store: any, ...args: infer P) => infer R
          ? (type: `${string & K}/${string & U}`, ...args: P extends [] ? [payload?: undefined, options?: DispatchOptions] : [payload: P[0], options?: DispatchOptions]) => R
          : never
      }[keyof M]
    : never
}[keyof RootModulesType] | (
  typeof storeOptions extends { actions: infer M }
    ? {
        [U in keyof M]: M[U] extends (store: any, ...args: infer P) => infer R
          ? (type: `${string & U}`, ...args: P extends [] ? [payload?: undefined, options?: DispatchOptions] : [payload: P[0], options?: DispatchOptions]) => R
          : never
      }[keyof M]
    : never
)>

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export interface RootModules extends RootModulesType {
}

export interface RootState extends RootStateType {
}

export interface RootGetters extends RootGettersType {
}

export interface RootMutations extends RootMutationsType {
}

export interface RootActions extends RootActionsType {
}
