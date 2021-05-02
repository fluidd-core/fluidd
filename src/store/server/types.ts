export interface ServerState {
  klippy_retries: number;
  info: ServerInfo;
  config: ServerConfig;
  moonraker_stats: ServerSystemStat[];
  throttled_state: ServerThrottledState | null;
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
