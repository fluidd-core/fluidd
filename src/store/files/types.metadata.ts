export interface AppFileMeta extends Omit<Moonraker.Files.Metadata, 'filament_name' | 'filament_type'> {
  modified: number;
  filament_name?: string[];
  filament_type?: string[];
}
