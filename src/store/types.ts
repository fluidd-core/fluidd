import { ConfigState } from './config/types'
import { FilesState } from './files/types'
import { SocketState } from './socket/types'

export interface RootState {
  version: string;
  hash: string;
  config?: ConfigState;
  files?: FilesState;
  socket?: SocketState;
}
