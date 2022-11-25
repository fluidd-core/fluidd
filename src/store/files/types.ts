import { KlipperFileMeta, Thumbnail } from './types.metadata'
import { HistoryItem } from '@/store/history/types'

export type { KlipperFileMeta, Thumbnail }

export interface FilesState {
  uploads: FilesUpload[];
  download: FileDownload | null;
  currentPaths: CurrentPaths;
  disk_usage: DiskUsage;
  rootFiles: RootFiles;

  gcodes: Files[];
  config: Files[];
  config_examples: Files[];
  docs: Files[];
  logs: Files[];
  timelapse: Files[]; // may be null, but will never be accessed when feature is unsupported
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
}

export interface CurrentPaths {
  [root: string]: string;
}

export interface Files {
  path: string;
  items: (FileBrowserEntry | AppFileWithMeta)[];
}

export interface AppFile extends KlipperFile {
  type: 'file';
  name?: string;
  extension: string;
  filename: string;
  modified: number;
  size: number;
  path: string;
}

export interface KlipperFile {
  filename: string;
  modified: number;
  size: number;
  print_start_time?: number | null;
  job_id?: string | null;
}

export interface AppFileWithMeta extends AppFile, KlipperFileMeta {
  history: HistoryItem;
}
export interface KlipperFileWithMeta extends KlipperFile, KlipperFileMeta {}

export interface AppDirectory {
  type: 'directory';
  name?: string;
  dirname: string;
  modified: number | null;
  size: number;
}

export interface FileMetaDataSocketResponse {
  estimated_time: string;
}

export interface FileChangeSocketResponse {
  action: string;
  item: FileChangeItem;
  source_item?: FileChangeItem;
}

export interface FileChangeItem {
  root: string;
  path: string;
  modified: number;
  size: number;
}

export interface FilePaths {
  filename: string;
  path: string;
  rootPath: string;
}

export interface FileUpdate {
  paths: FilePaths;
  file: AppFile | AppFileWithMeta;
  root: string;
}

export interface FileDownload {
  filepath: string;
  size: number;
  loaded: number;
  percent: number;
  speed: number;
  unit: string;
}

export interface FilesUpload extends FileDownload {
  complete: boolean; // indicates moonraker is finished with the file.
  cancelled: boolean; // in a cancelled state, don't show - nor try to upload.
}

export type FileFilterType = 'print_start_time' | 'hidden_files' | 'klipper_backup_files'

export type FileRoot = 'gcodes' | 'config' | 'config_examples' | 'docs' | 'logs' | 'timelapse'

export type FileBrowserEntry = AppFile | AppDirectory

export interface FilePreviewState {
  open: boolean;
  filename: string;
  src: string;
  type: string;
  appFile?: AppFile;
  width?: number;
}

export interface RootFiles {
  gcodes: RootFile[];
  config: RootFile[];
  config_examples: RootFile[];
  docs: RootFile[];
  logs: RootFile[];
  timelapse: RootFile[];
}

export interface RootFile {
  path: string;
  modified: number;
  size: number;
  permissions: string;
}
