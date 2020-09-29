import { ConfigState } from './config/types'
import { FilesState } from './files/types'
import { SocketState } from './socket/types'

export interface RootState {
  version: string;
  darkMode: boolean;
  config?: ConfigState;
  files?: FilesState;
  socket?: SocketState;
}
