import type { MoonrakerFileMeta, MoonrakerFileMetaThumbnail } from './types.metadata'
import type { HistoryItem } from '@/store/history/types'

export type { MoonrakerFileMeta, MoonrakerFileMetaThumbnail }

export interface FilesState {
  uploads: FileUpload[];
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

export interface MoonrakerRootFile {
  path: string;
  modified: number;
  size: number;
  permissions: string;
}

export interface MoonrakerPathContent {
  files: (MoonrakerFile | MoonrakerFileWithMeta) []
  dirs: MoonrakerDir[]
}

type MoonrakerFilePermissions = '' | 'r' | 'rw'

export interface MoonrakerFile {
  filename: string;
  modified: number | string;
  size: number;
  permissions?: MoonrakerFilePermissions;
}

export interface MoonrakerFileWithMeta extends MoonrakerFile, MoonrakerFileMeta {
  print_start_time?: number | null;
  job_id?: string | null;
}

export interface MoonrakerDir {
  dirname: string;
  modified: number | string;
  size: number;
  permissions?: MoonrakerFilePermissions;
}

export interface AppFile extends MoonrakerFile {
  type: 'file';
  name: string;
  extension: string;
  path: string;
  modified: number;
}

export interface AppFileWithMeta extends AppFile, MoonrakerFileWithMeta {
  modified: number;
  history?: HistoryItem;
}

export interface AppFileThumbnail extends MoonrakerFileMetaThumbnail {
  url: string;
}

export interface AppDirectory extends MoonrakerDir {
  type: 'directory';
  name: string;
  modified: number;
}

export interface DirectoryInformation {
  dirs: MoonrakerDir[];
  files: (MoonrakerFile | MoonrakerFileWithMeta)[];
  disk_usage: DiskUsage;
  root_info: RootInfo;
}

export interface RootInfo {
  name: string;
  permissions?: MoonrakerFilePermissions;
}

export interface FileChange {
  action: 'create_file' | 'create_dir' | 'delete_file' | 'delete_dir' | 'move_file' | 'move_dir' | 'modify_file' | 'root_update';
  item: FileChangeItem;
  source_item?: {
    root: string;
    path: string;
  };
}

export interface FileChangeItem {
  root: string;
  path: string;
  modified: number;
  size: number;
  permissions?: MoonrakerFilePermissions;
}

export interface FilePaths {
  root: string;
  rootPath: string;
  rootPathFilename: string;
  path: string;
  pathFilename: string;
  filename: string;
  extension: string;
  filtered: boolean;
}

export interface FileDownload {
  uid: string;
  filepath: string;
  size: number;
  loaded: number;
  percent: number;
  speed: number;
  abortController: AbortController;
}

export interface FileUpload extends FileDownload {
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
