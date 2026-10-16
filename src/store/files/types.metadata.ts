export interface AppFileMeta extends Omit<Moonraker.Files.Metadata, 'filament_name' | 'filament_type'> {
  filament_name?: string[];
  filament_type?: string[];
}
