import type { KlipperFileMeta, KlipperFileMetaThumbnail } from './types.metadata'
import type { HistoryItem } from '@/store/history/types'

export type { KlipperFileMeta, KlipperFileMetaThumbnail }

export interface FilesState {
  uploads: FilesUpload[];
  download: FileDownload | null;
  currentPaths: Record<string, string>;
  disk_usage: DiskUsage;
  rootFiles: Record<string, MoonrakerRootFile[] | undefined>;
  pathFiles: Record<string, MoonrakerPathContent | undefined>;
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
}

export interface MoonrakerPathContent {
  files: (KlipperFile | KlipperFileWithMeta) []
  dirs: KlipperDir[]
}

export interface KlipperFile {
  filename: string;
  modified: number | string;
  size: number;
  permissions?: '' | 'r' | 'rw';
  print_start_time?: number | null;
  job_id?: string | null;
}

export interface KlipperFileWithMeta extends KlipperFile, KlipperFileMeta {
}

export interface KlipperDir {
  dirname: string;
  modified: number | string;
  size: number;
  permissions?: '' | 'r' | 'rw';
}

export interface AppFile extends KlipperFile {
  type: 'file';
  name: string;
  extension: string;
  path: string;
  modified: number;
}

export interface AppFileWithMeta extends AppFile, KlipperFileMeta {
  history: HistoryItem;
}

export interface AppFileThumbnail extends KlipperFileMetaThumbnail {
  url: string;
}

export interface AppDirectory extends KlipperDir {
  type: 'directory';
  name: string;
  modified: number;
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
  filtered: boolean;
}

export interface FileUpdate {
  paths: FilePaths;
  file: Partial<KlipperFile | KlipperFileWithMeta> & { filename: string; };
  root: string;
}

export interface FileDownload {
  filepath: string;
  size: number;
  loaded: number;
  percent: number;
  speed: number;
  abortController: AbortController;
}

export interface FilesUpload extends FileDownload {
  complete: boolean; // indicates moonraker is finished with the file.
  cancelled: boolean; // in a cancelled state, don't show - nor try to upload.
}

export type FileFilterType = 'print_start_time' | 'hidden_files' | 'klipper_backup_files' | 'rolled_log_files' | 'moonraker_backup_files' | 'moonraker_temporary_upload_files' | 'crowsnest_backup_files'

export type FileBrowserEntry = AppFile | AppFileWithMeta | AppDirectory

export interface RootProperties {
  readonly: boolean;
  accepts: string[];
  canView: string[];
  canConfigure: boolean;
  filterTypes: FileFilterType[]
}

export interface MoonrakerRootFile {
  path: string;
  modified: number;
  size: number;
  permissions: string;
}
