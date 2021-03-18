export interface FilesState {
  [key: string]: Files[] | FilesUpload[] | string[] | CurrentPaths | DiskUsage;
  availableRoots: string[];
  gcodes: Files[];
  config: Files[];
  config_examples: Files[];
  docs: Files[];
  uploads: FilesUpload[];
  currentPaths: CurrentPaths;
  disk_usage: DiskUsage;
}

export interface DiskUsage {
  total: number;
  used: number;
  free: number;
}

export interface CurrentPaths {
  [index: string]: string;
}

export interface Files {
  path: string;
  items: (AppFile | AppFileWithMeta | AppDirectory)[];
}

export interface AppFile {
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
  print_start_time: number | null;
  job_id: number | null;
}

export interface KlipperFileMeta {
  estimated_time?: number;
  filament_total?: number;
  first_layer_bed_temp?: number;
  first_layer_extr_temp?: number;
  first_layer_height?: number;
  gcode_end_byte?: number;
  gcode_start_byte?: number;
  layer_height?: number;
  object_height?: number;
  slicer?: string;
  slicer_version?: string;
  thumbnails?: Thumbnail[];
}

export interface AppFileWithMeta extends AppFile, KlipperFileMeta {
  start_time?: number;
}
export interface KlipperFileWithMeta extends KlipperFile, KlipperFileMeta {}

export interface AppDirectory {
  type: 'directory';
  name?: string;
  dirname: string;
  modified: number;
  size: number;
}

export interface Thumbnail {
  data: string;
  relative_path: string;
  absolute_path?: string;
  height: number;
  width: number;
  size: number;
}

export interface FileMetaDataSocketResponse {
  estimated_time: string;
}

export interface FileChangeSocketResponse {
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

export interface FilesUpload {
  filename: string;
  percentUploaded: number;
  processingComplete: boolean; // indicates moonraker is finished with the file.
}
