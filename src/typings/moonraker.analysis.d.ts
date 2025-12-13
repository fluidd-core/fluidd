declare namespace Moonraker.Analysis {
  export interface StatusResponse {
    estimator_executable: string;
    estimator_ready: boolean;
    estimator_version: string;
    estimator_config_exists: boolean;
    using_default_config: boolean;
  }

  export interface EstimateResponse {
    total_time: number;
    total_distance: number;
    total_extrude_distance: number;
    max_flow: number;
    max_speed: number;
    num_moves: number;
    total_z_time: number;
    total_output_time: number;
    total_travel_time: number;
    total_extrude_only_time: number;
    phase_times: {
      acceleration: number;
      cruise: number;
      deceleration: number;
    };
    kind_times: Record<string, number>;
    layer_times: [number, number][]
  }

  export interface ProcessResponse {
    prev_processed: boolean;
    version: string;
    bypassed: boolean;
  }
}
