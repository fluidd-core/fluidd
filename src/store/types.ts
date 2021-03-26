import { SocketState } from './socket/types'
import { ServerState } from './server/types'
import { PrinterState } from './printer/types'
import { ConfigState } from './config/types'
import { FilesState } from './files/types'
import { ChartState } from './charts/types'
import { ConsoleState } from './console/types'
import { MacrosState } from './macros/types'
import { DevicePowerState } from './devicePower/types'
import { HistoryState } from './history/types'
import { VersionState } from './version/types'

export interface RootState {
  socket?: SocketState;
  server?: ServerState;
  printer?: PrinterState;
  config?: ConfigState;
  files?: FilesState;
  charts?: ChartState;
  console?: ConsoleState;
  macros?: MacrosState;
  devicePower?: DevicePowerState;
  history?: HistoryState;
  version?: VersionState;
}
