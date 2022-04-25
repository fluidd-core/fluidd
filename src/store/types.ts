import { SocketState } from './socket/types'
import { ServerState } from './server/types'
import { PrinterState } from './printer/types'
import { ConfigState } from './config/types'
import { FilesState } from './files/types'
import { ChartState } from './charts/types'
import { ConsoleState } from './console/types'
import { MacrosState } from './macros/types'
import { DevicePowerState } from './power/types'
import { HistoryState } from './history/types'
import { VersionState } from './version/types'
import { GcodePreviewState } from './gcodePreview/types'
import { LayoutState } from './layout/types'
import { MeshState } from './mesh/types'
import { NotificationsState } from './notifications/types'
import { AnnouncementsState } from './announcements/types'
import { AuthState } from './auth/types'
import { TimelapseState } from '@/store/timelapse/types'

export interface RootState {
  socket?: SocketState;
  auth?: AuthState;
  server?: ServerState;
  printer?: PrinterState;
  config?: ConfigState;
  layout?: LayoutState;
  mesh?: MeshState;
  files?: FilesState;
  charts?: ChartState;
  console?: ConsoleState;
  macros?: MacrosState;
  power?: DevicePowerState;
  history?: HistoryState;
  version?: VersionState;
  gcodePreview?: GcodePreviewState;
  notifications?: NotificationsState;
  announcements?: AnnouncementsState;
  timelapse?: TimelapseState;
}

export type AppNotificationType = 'success' | 'info' | 'warning' | 'error' | 'announcement'
