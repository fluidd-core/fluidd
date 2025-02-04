import type { SocketState } from './socket/types'
import type { ServerState } from './server/types'
import type { PrinterState } from './printer/types'
import type { ConfigState } from './config/types'
import type { FilesState } from './files/types'
import type { ChartState } from './charts/types'
import type { ConsoleState } from './console/types'
import type { MacrosState } from './macros/types'
import type { DevicePowerState } from './power/types'
import type { HistoryState } from './history/types'
import type { VersionState } from './version/types'
import type { GcodePreviewState } from './gcodePreview/types'
import type { LayoutState } from './layout/types'
import type { MeshState } from './mesh/types'
import type { NotificationsState } from './notifications/types'
import type { AnnouncementsState } from './announcements/types'
import type { AuthState } from './auth/types'
import type { TimelapseState } from '@/store/timelapse/types'
import type { WaitState } from './wait/types'
import type { WebcamsState } from './webcams/types'
import type { JobQueueState } from './jobQueue/types'
import type { SpoolmanState } from './spoolman/types'
import type { MoonrakerSensorsState } from './sensors/types'

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
  mesh: MeshState;
  notifications: NotificationsState;
  announcements: AnnouncementsState;
  wait: WaitState;
  gcodePreview: GcodePreviewState;
  timelapse: TimelapseState;
  webcams: WebcamsState;
  jobQueue: JobQueueState;
  spoolman: SpoolmanState;
  sensors: MoonrakerSensorsState;
}
