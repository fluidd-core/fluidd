export interface KlipperFileMeta {
  chamber_temp?: number;
  estimated_time?: number;
  filament_name?: string;
  filament_total?: number;
  filament_type?: string;
  filament_weight_total?: number;
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
  thumbnails?: Thumbnail[];
}

export interface Thumbnail {
  data: string;
  relative_path: string;
  absolute_path?: string;
  height: number;
  width: number;
  size: number;
}
