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
  warnings: string[];
  api_version?: number[]
  api_version_string?: string
}

export interface SystemInfo {
  available_services?: string[];
  service_state?: ServiceState;
  cpu_info?: CpuInfo;
  sd_info?: SDInfo;
  distribution?: DistroInfo;
  virtualization?: Virtualization;
  network?: NetworkState;
  canbus?: CanBusState;
  instance_ids: InstanceIds;
}

export interface ServiceState {
  [id: string]: ServiceStateDetails;
}

interface ServiceStateDetails {
  active_state?: string;
  sub_state?: string;
}

export interface ServiceInfo {
  name: string;
  active_state?: string;
  sub_state?: string;
}

export interface CpuInfo {
  cpu_count: number;
  bits: string;
  processor: string;
  cpu_desc: string;
  hardware_desc: string;
  model: string;
  total_memory: number;
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
  release_info?: ReleaseInfo;
}

export interface ReleaseInfo {
  codename?: string;
  id?: string;
  name?: string;
  version_id?: string;
}

export interface DistroVersionParts {
  major: string;
  minor: string;
  build_number: string;
}

export interface Virtualization {
  virt_type: string;
  virt_identifier: string;
}

export interface NetworkState {
  [id: string]: NetworkInterface
}

export interface NetworkInterface {
  mac_address?: string;
  ip_addresses?: NetworkIpAddress[];
}

export interface NetworkIpAddress {
  family?: string;
  address?: string;
  is_link_local?: boolean;
}

export interface CanBusState {
  [id: string]: CanBusInterface;
}

export interface CanBusInterface {
  tx_queue_len?: number;
  bitrate?: number;
  driver?: string;
}

export interface InstanceIds {
  moonraker: string;
  klipper: string;
}

export interface ServerConfig {
  authorization: ServerAuthorization;
  server: ServerConfiguration;
  data_store?: DataStoreConfiguration;
  spoolman?: SpoolmanConfiguration;
}

export interface ServerAuthorization {
  enabled: boolean;
}

export interface ServerConfiguration {
  gcode_store_size?: number;
  temperature_store_size?: number;
}

export interface DataStoreConfiguration {
  gcode_store_size?: number;
  temperature_store_size?: number;
}

export interface SpoolmanConfiguration {
  server?: string;
}
