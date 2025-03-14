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
import type { sensors } from './sensors'
import type { analysis } from './analysis'

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
  sensors: typeof sensors,
  analysis: typeof analysis
}

type RootStateType = {
  [K in keyof RootModulesType]: RootModulesType[K] extends { state: infer U } ? U : never
}

export type RootGettersType = UnionToIntersection<{
  [K in keyof RootModulesType]: RootModulesType[K] extends { getters: infer S }
    ? S extends Record<string, (...args: any) => any>
      ? {
          [U in keyof S as `${string & K}/${string & U}`]: ReturnType<S[U]>
        }
      : never
    : never
}[keyof RootModulesType]>

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never

export interface RootModules extends RootModulesType {
}

export interface RootState extends RootStateType {
}

export interface RootGetters extends RootGettersType {
}
