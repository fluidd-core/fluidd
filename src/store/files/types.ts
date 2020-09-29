export interface FilesState {
  [key: string]: Files[];
  gcodes: Files[];
  config: Files[];
  configExamples: Files[];
}

export interface Files {
  path: string;
  files: File[];
  dirs: Directory[];
}

export interface File {
  type: string;
  name?: string;
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
