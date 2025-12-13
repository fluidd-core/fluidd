import type { AppFileMeta } from './types.metadata'
import type { HistoryItem } from '@/store/history/types'

export type { AppFileMeta }

export interface FilesState {
  uploads: FileUpload[];
  download: FileDownload | null;
  currentPaths: Record<string, string>;
  diskUsage: Record<string, Moonraker.Files.DiskUsage | undefined>;
  rootFiles: Record<string, Moonraker.Files.RootFile[] | undefined>;
  pathContent: Record<string, MoonrakerPathContent | undefined>;
}

export interface AppDiskUsage extends Moonraker.Files.DiskUsage {
  usedPercent: number;
  lowOnSpace: boolean;
}

export interface MoonrakerPathContent {
  partial?: boolean;
  files: (Moonraker.Files.File | Moonraker.Files.FileWithMeta)[];
  dirs: Moonraker.Files.Dir[];
}

export interface AppFile extends Moonraker.Files.File, Pick<Moonraker.Files.Metadata, 'thumbnails'> {
  type: 'file';
  name: string;
  extension: string;
  path: string;
  modified: number;
}

export interface AppFileWithMeta extends AppFile, AppFileMeta {
  print_start_time?: number | null;
  job_id?: string | null;
  history?: HistoryItem;
}

export interface AppFileThumbnail extends Moonraker.Files.MetadataThumbnail {
  url: string;
}

export interface AppDirectory extends Moonraker.Files.Dir {
  type: 'directory';
  name: string;
  modified: number;
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
