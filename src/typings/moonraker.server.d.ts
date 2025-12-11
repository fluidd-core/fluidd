declare namespace Moonraker.Server {
  export interface ConnectionIdentifyResponse {
    connection_id: number;
  }

  export interface InfoResponse {
    klippy_connected: boolean;
    klippy_state: KlippyState;
    components: string[];
    failed_components: string[];
    registered_directories: string[];
    warnings: string[];
    websocket_count?: number;
    moonraker_version?: string;
    api_version?: number[];
    api_version_string?: string;
  }

  export interface TemperatureStoreResponse {
    [key: string]: TemperatureStoreEntry;
  }

  export interface GcodeStoreResponse {
    gcode_store: GcodeStoreEntry[];
  }

  export interface LogsRolloverResponse {
    rolled_over?: string[];
    failed?: Record<string, unknown>;
  }

  export type KlippyState = 'disconnected' | 'startup' | 'ready' | 'error' | 'shutdown'

  export interface ConfigResponse {
    config: Config;
    orig: Record<string, unknown>;
    files: [];
  }

  export interface Config {
    [key: string]: Record<string, any> | undefined;
    server?: ConfigServer;
    data_store?: ConfigDataStore;
    authorization?: ConfigAuthorization;
    template?: Record<string, unknown>;
  }

  export interface ConfigServer {
    host?: string;
    port?: number;
    ssl_port?: number;
    enable_debug_logging?: boolean;
    enable_asyncio_debug?: boolean;
    klippy_uds_address?: string;
    max_upload_size?: number;
    ssl_certificate_path?: string | null;
    ssl_key_path?: string | null;
    temperature_store_size?: number;
    gcode_store_size?: number;
    spoolman?: ConfigSpoolman;
  }

  export interface ConfigDataStore {
    temperature_store_size?: number;
    gcode_store_size?: number;
  }

  export interface ConfigAuthorization {
    login_timeout?: number;
    force_logins?: boolean;
    cors_domains?: string[];
    trusted_clients?: string[];
  }

  export interface ConfigSpoolman {
    server?: string;
  }

  export interface TemperatureStoreEntry {
    temperatures: number[];
    targets?: number[];
    powers?: number[];
    speeds?: number[];
  }

  export interface GcodeStoreEntry {
    message: string;
    time?: number;
    type: 'command' | 'response';
  }
}
