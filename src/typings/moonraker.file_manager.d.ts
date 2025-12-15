declare namespace Moonraker.Files {
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
    permissions?: Moonraker.Files.FilePermissions;
  }

  export interface GetDirectoryResponse {
    dirs: Moonraker.Files.Dir[];
    files: (Moonraker.Files.File | Moonraker.Files.FileWithMeta)[];
    disk_usage: Moonraker.Files.DiskUsage;
    root_info: RootInfo;
  }

  export interface RootInfo {
    name: string;
    permissions?: Moonraker.Files.FilePermissions;
  }

  export type FilePermissions = '' | 'r' | 'rw'

  export interface File {
    filename: string;
    modified: number | string;
    size: number;
    permissions?: FilePermissions;
  }

  export interface Dir {
    dirname: string;
    modified: number | string;
    size: number;
    permissions?: Moonraker.Files.FilePermissions;
  }

  export interface FileWithMeta extends File, Metadata {
    print_start_time?: number | null;
    job_id?: string | null;
  }

  export interface RootFile {
    path: string;
    modified: number;
    size: number;
    permissions: string;
  }

  export interface DiskUsage {
    total: number;
    used: number;
    free: number;
  }

  export interface Metadata {
    modified: number | string;
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
