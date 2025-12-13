declare namespace Moonraker.Machine {
  export interface SystemInfoResponse {
    system_info: SystemInfo;
  }

  export interface SystemInfo {
    provider: string;
    cpu_info?: CpuInfo;
    sd_info: SDInfo;
    distribution: Distribution;
    available_services: string[];
    instance_ids: InstanceIds;
    service_state: ServiceState;
    virtualization?: Virtualization;
    python: Python;
    network?: Network;
    canbus?: CanBus;
  }

  export interface CpuInfo {
    cpu_count: number;
    bits: string;
    processor: string;
    cpu_desc: string;
    serial_number: string;
    hardware_desc: string;
    model: string;
    total_memory: number;
    memory_units: string;
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

  export interface Distribution {
    name: string;
    id: string;
    version: string;
    version_parts: DistributionVersionParts;
    like: string;
    codename: string;
    release_info?: ReleaseInfo;
  }

  export interface DistributionVersionParts {
    major: string;
    minor: string;
    build_number: string;
  }

  export interface ReleaseInfo {
    codename?: string;
    id?: string;
    name?: string;
    version_id?: string;
  }

  export interface InstanceIds {
    moonraker: string;
    klipper: string;
  }

  export interface ServiceState extends Record<string, ServiceStateDetails> {
  }

  interface ServiceStateDetails {
    active_state?: string;
    sub_state?: string;
  }

  export interface Virtualization {
    virt_type: string;
    virt_identifier: string;
  }

  export interface Python {
    version: (string | number)[];
    version_string: string;
  }

  export interface Network extends Record<string, NetworkInterface> {
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

  export interface CanBusState extends Record<string, CanBusInterface> {
  }

  export interface CanBusInterface {
    tx_queue_len?: number;
    bitrate?: number;
    driver?: string;
  }
}
