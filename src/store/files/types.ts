export interface FilesState {
  [key: string]: Files[];
  gcodes: Files[];
  config: Files[];
  config_examples: Files[];
}

export interface Files {
  path: string;
  files: KlipperFile[];
  dirs: Directory[];
}

export interface KlipperFile {
  type: string;
  name?: string;
  extension: string;
  filename: string;
  modified: number;
  size: number;
}

export interface Directory {
  type: string;
  name?: string;
  dirname: string;
  modified: number;
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
