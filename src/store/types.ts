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
import { PartsState } from './parts/types'
import { LayoutState } from './layout/types'
import { MeshState } from './mesh/types'
import { NotificationsState } from './notifications/types'
import { AnnouncementsState } from './announcements/types'
import { AuthState } from './auth/types'
import { TimelapseState } from '@/store/timelapse/types'
import { CamerasState } from './cameras/types'
import { WaitState } from './wait/types'
import { WebcamsState } from './webcams/types'

export interface RootState {
  socket: SocketState;
  auth: AuthState;
  server: ServerState;
  printer: PrinterState;
  config: ConfigState;
  files: FilesState;
  layout: LayoutState;
  charts: ChartState;
  console: ConsoleState;
  macros: MacrosState;
  power: DevicePowerState;
  history: HistoryState;
  version: VersionState;
  cameras: CamerasState;
  mesh: MeshState;
  notifications: NotificationsState;
  announcements: AnnouncementsState;
  wait: WaitState;
  gcodePreview: GcodePreviewState;
  timelapse: TimelapseState;
  parts: PartsState;
  webcams: WebcamsState;
}
