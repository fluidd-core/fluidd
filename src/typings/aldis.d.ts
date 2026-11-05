declare namespace Aldis {
  export type KlippyState = 'ready' | 'startup' | 'error' | 'shutdown' | 'disconnected'

  export interface Host {
    klippy_state: KlippyState;
    klippy_message: string;
    software_version?: string;
    klipper_path?: string;
    checkout_version?: string;
  }

  export type BlockerReason =
    | 'non_local_moonraker'
    | 'unsupported_instance'
    | 'config_error'
    | 'klippy_unavailable'
    | 'restart_pending'
    | 'printing'

  export interface Blocker {
    reason: BlockerReason | string;
    message: string;
  }

  export type Transport =
    | { type: 'serial'; device: string }
    | { type: 'can'; interface: string; uuid: string }

  export type McuState =
    | 'current'
    | 'update_available'
    | 'indeterminate'
    | 'externally_managed'
    | 'unsupported_legacy'
    | 'not_identified'
    | 'not_responding'

  export interface Mcu {
    name: string;
    transport: Transport | null;
    running_version: string | null;
    state: McuState | string;
    message: string;
    actions: string[];
  }

  export type Phase =
    | 'discover'
    | 'stop-klipper'
    | 'build'
    | 'enter-bootloader'
    | 'flash'
    | 'verify'
    | 'start-klipper'
    | 'reconnect'
    | 'done'

  export interface McuResult {
    name: string;
    outcome: 'updated' | 'failed' | 'not_attempted';
    message: string;
  }

  export interface RunResult {
    outcome: 'success' | 'failed';
    klippy_state: KlippyState;
    klipper_left_stopped: boolean;
    mcus: McuResult[];
  }

  export interface UpdateResponse {
    run_id: string;
    mcu: string | null;
    phase: Phase | string;
    message: string;
    complete: boolean;
    result?: RunResult | null;
  }

  export interface Run {
    run_id: string;
    state: 'running' | 'finished';
    messages: UpdateResponse[];
    result: RunResult | null;
  }

  export interface StatusResponse {
    api_version: number;
    host: Host;
    blocker: Blocker | null;
    mcus: Mcu[];
    run: Run | null;
  }

  export type UpdateArguments =
    | { mcus: string[] }
    | { all: true }

  export interface UpdateResult {
    run_id: string;
  }

  export type ErrorReason =
    | 'busy'
    | 'blocked'
    | 'unknown_mcu'
    | 'not_updatable'
    | 'nothing_to_update'
    | 'unavailable'
    | 'invalid_request'
    | 'unknown_method'

  export interface AgentError {
    code: number;
    message: string;
    data?: {
      reason?: ErrorReason | string;
      [key: string]: unknown;
    };
  }
}
