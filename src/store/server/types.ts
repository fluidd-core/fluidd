export interface ServerState {
  klippy_retries: number;
  info: ServerInfo;
  config: ServerConfig;
}

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
