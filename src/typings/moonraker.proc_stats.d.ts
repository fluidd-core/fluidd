declare namespace Moonraker.ProcStats {
  export interface Response {
    moonraker_stats: MoonrakerStats[];
    throttled_state: ThrottledState | null;
    cpu_temp: number | null;
    network: Record<string, NetworkStats>;
    system_cpu_usage: Record<string, number>;
    system_uptime: number;
    system_memory: SystemMemory;
  }

  export interface MoonrakerStats {
    time: number;
    cpu_usage: number;
    memory: number;
    mem_units: string;
  }

  export interface ThrottledState {
    bits: number;
    flags: ThrottledStateFlags[];
  }

  export type ThrottledStateFlags =
    'Under-Voltage Detected' |
    'Frequency Capped' |
    'Currently Throttled' |
    'Temperature Limit Active' |
    'Previously Under-Volted' |
    'Previously Frequency Capped' |
    'Previously Throttled' |
    'Previously Temperature Limited'

  export interface NetworkStats {
    rx_bytes: number;
    tx_bytes: number;
    rx_packets: number;
    tx_packets: number;
    rx_errs: number;
    tx_errs: number;
    rx_drop: number;
    tx_drop: number;
    bandwidth: number;
  }

  export interface SystemMemory {
    total: number;
    available: number;
    used: number;
  }
}
