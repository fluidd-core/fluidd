export interface MoonrakerFileMeta {
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
  thumbnails?: MoonrakerFileMetaThumbnail[];
}

export interface AppFileMeta extends Omit<MoonrakerFileMeta, 'filament_name' | 'filament_type'> {
  modified: number;
  filament_name?: string[];
  filament_type?: string[];
}

export interface MoonrakerFileMetaThumbnail {
  relative_path: string;
  height: number;
  width: number;
  size: number;
}
