export interface ServerState {
  klippy_retries: number;
  info: ServerInfo;
  system_info: SystemInfo | null;
  config: ServerConfig;
  moonraker_stats: ServerSystemStat[];
  throttled_state: ServerThrottledState | null;
  cpu_temp: number | null;
}

export interface ServerSystemStat {
  time: number;
  cpu_usage: number;
  memory: number;
  mem_units: string;
}

export interface ServerThrottledState {
  bits: number;
  flags: ServerFlags[];
}

export type ServerFlags =
  'Under-Voltage Detected' |
  'Frequency Capped' |
  'Currently Throttled' |
  'Temperature Limit Active' |
  'Previously Under-Volted' |
  'Previously Frequency Capped' |
  'Previously Throttled' |
  'Previously Temperature Limited'

export interface ServerInfo {
  failed_components: string[];
  klippy_connected: boolean;
  klippy_state: string;
  components: string[];
  registered_directories: string[];
}

export interface SystemInfo {
  cpu_info?: CpuInfo;
  sd_info?: SDInfo;
  distribution?: DistroInfo;
}

export interface CpuInfo {
  cpu_count: number;
  bits: string;
  processor: string;
  cpu_desc: string;
  hardware_desc: string;
  model: string;
}

export interface SDInfo {
  manufacturer_id: string;
  manufacturer: string;
  oem_id: string;
  product_name: string;
  product_revision: string;
  serial_number: string;
  manufacturer_date: string;
  capacity: string;
  total_bytes: number;
}

export interface DistroInfo {
  name: string;
  id: string;
  version: string;
  version_parts: DistroVersionParts;
  like: string;
  codename: string;
}

export interface DistroVersionParts {
  major: string;
  minor: string;
  build_number: string;
}

export interface ServerConfig {
  authorization: ServerAuthorization;
  server: ServerConfiguration;
}

export interface ServerAuthorization {
  enabled: boolean;
}

export interface ServerConfiguration {
  gcode_store_size: number;
  temperature_store_size: number;
}
