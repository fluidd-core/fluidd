declare namespace Moonraker.Files {
  export interface RootsResponse extends Array<RootInfoWithPath> {
  }

  export interface ListRootResponse extends Array<RootFile> {
  }

  export interface FileWithMetaResponse extends FileWithMeta {
  }

  export interface ChangeResponse {
    action: 'create_file' | 'create_dir' | 'delete_file' | 'delete_dir' | 'move_file' | 'move_dir' | 'modify_file' | 'root_update';
    item: ChangeItem;
    source_item?: {
      root: string;
      path: string;
    };
  }

  export interface ZipResponse {
    action: 'zip_files';
    destination: ChangeItem;
  }

  export interface ChangeItem {
    root: string;
    path: string;
    modified: number;
    size: number;
    permissions: FilePermissions;
  }

  export interface GetDirectoryResponse {
    dirs: Dir[];
    files: (File | FileWithMeta)[];
    disk_usage: DiskUsage;
    root_info: RootInfo;
  }

  export interface RootInfo {
    name: string;
    permissions: 'r' | 'rw';
  }

  export interface RootInfoWithPath extends RootInfo {
    path: string;
  }

  export type FilePermissions = '' | 'r' | 'rw'

  export interface File {
    filename: string;
    modified: number;
    size: number;
    permissions: FilePermissions;
  }

  export interface Dir {
    dirname: string;
    modified: number;
    size: number;
    permissions: FilePermissions;
  }

  export interface FileWithMeta extends File, Metadata {
    print_start_time?: number | null;
    job_id?: string | null;
  }

  export interface RootFile {
    path: string;
    modified: number;
    size: number;
    permissions: FilePermissions;
  }

  export interface DiskUsage {
    total: number;
    used: number;
    free: number;
  }

  export interface Metadata {
    modified: number;
    size: number;
    uuid?: string;
    chamber_temp?: number;
    estimated_time?: number;
    filament_name?: string;
    filament_colors?: string[];
    extruder_colors?: string[];
    filament_temps?: number[];
    filament_total?: number;
    filament_change_count?: number;
    filament_type?: string;
    filament_weight_total?: number;
    filament_weights?: number[];
    printer_vendor?: string;
    printer_model?: string;
    printer_variant?: string;
    profile_version?: string;
    mmu_print?: number;
    referenced_tools?: number[];
    first_layer_bed_temp?: number;
    first_layer_extr_temp?: number;
    first_layer_height?: number;
    gcode_end_byte?: number;
    gcode_start_byte?: number;
    layer_count?: number;
    layer_height?: number;
    nozzle_diameter?: number;
    object_height?: number;
    slicer?: string;
    slicer_version?: string;
    file_processors?: string[];
    thumbnails?: MetadataThumbnail[];
  }

  export interface MetadataThumbnail {
    relative_path: string;
    height: number;
    width: number;
    size: number;
  }
}

declare namespace Moonraker {
  export interface Methods {
    'server.files.list': {
      params: {
        root?: string
      },
      result: Files.ListRootResponse
    },
    'server.files.roots': {
      params: undefined,
      result: Files.RootsResponse
    },
    'server.files.metadata': {
      params: {
        filename: string
      },
      result: Files.FileWithMetaResponse
    },
    'server.files.metascan': {
      params: {
        filename: string
      },
      result: Files.FileWithMetaResponse
    },
    'server.files.get_directory': {
      params: {
        path?: string,
        extended?: boolean
      },
      result: Files.GetDirectoryResponse
    },
    'server.files.post_directory': {
      params: {
        path: string
      },
      result: Files.ChangeResponse
    },
    'server.files.delete_directory': {
      params: {
        path: string,
        force?: boolean
      },
      result: Files.ChangeResponse
    },
    'server.files.move': {
      params: {
        source: string,
        dest: string
      },
      result: Files.ChangeResponse
    },
    'server.files.copy': {
      params: {
        source: string,
        dest: string
      },
      result: Files.ChangeResponse
    },
    'server.files.zip': {
      params: {
        dest?: string,
        items: string[],
        store_only?: boolean
      },
      result: Files.ZipResponse
    },
    'server.files.delete_file': {
      params: {
        path: string
      },
      result: Files.ChangeResponse
    }
  }

  export interface Notifications {
    notify_filelist_changed: [Files.ChangeResponse]
  }
}
