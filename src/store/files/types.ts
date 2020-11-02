export interface FilesState {
  [key: string]: Files[];
  gcodes: Files[];
  config: Files[];
  config_examples: Files[];
}

export interface Files {
  path: string;
  items: [KlipperFile | KlipperFileWithMeta | Directory];
}

export interface KlipperFile {
  type: 'file';
  name?: string;
  extension: string;
  filename: string;
  modified: number;
  size: number;
}

export interface KlipperFileWithMeta extends KlipperFile {
  estimated_time?: number;
  filament_total?: number;
  first_layer_bed_temp?: number;
  first_layer_extr_temp?: number;
  first_layer_height?: number;
  layer_height?: number;
  object_height?: number;
  slicer?: string;
  slicer_version?: string;
  thumbnails?: Thumbnail[];
}

export interface Directory {
  type: 'directory';
  name?: string;
  dirname: string;
  modified: number;
  size: number;
}

export interface Thumbnail {
  data: string;
  height: number;
  width: number;
  size: number;
}

export interface FileListChangeInfo {
  root: string;
  destination: FileListChangeItem;
  source?: FileListChangeItem;
}

export interface FileListChangeItem {
  item: string;
  path: string;
  notifyPath: string;
}
