declare namespace Moonraker.Spoolman {
  export interface SpoolIdResponse {
    spool_id: number
  }

  export interface ProxyResponseV2Success<T> {
    response: T;
    response_headers?: Record<string, string>;
    error: null;
  }

  export interface ProxyResponseV2Error {
    response: null;
    error: string | {
      message: string;
    };
  }

  export type ProxyResponseV2<T> = ProxyResponseV2Success<T> | ProxyResponseV2Error

  export type ProxyResponse<T> = T | ProxyResponseV2<T>

  export interface Info {
    version: string;
    debug_mode: boolean;
    automatic_backups: boolean;
    data_dir: string;
    logs_dir: string;
    backups_dir: string;
    db_type: string;
    git_commit: string;
    build_date: Date;
  }

  export interface Currency {
    value: string;
  }

  export interface Spool {
    id: number;
    registered: string;
    filament: Filament;

    first_used?: string;
    last_used?: string;
    price?: number;
    remaining_weight?: number;
    initial_weight?: number;
    spool_weight?: number;
    used_weight?: number;
    remaining_length?: number;
    used_length?: number;
    location?: string;
    lot_nr?: string;
    comment?: string;
    archived: boolean;
    extra?: Record<string, unknown>;
  }

  export interface Filament {
    id: number;
    registered: string;
    density: number;
    diameter: number;

    name?: string;
    vendor?: Vendor;
    material?: string;
    price?: number;
    weight?: number;
    spool_weight?: number;
    article_number?: string;
    comment?: string;
    settings_extruder_temp?: number;
    settings_bed_temp?: number;
    color_hex?: string;
    multi_color_hexes?: string;
    multi_color_direction?: string;
    external_id?: string;
    extra?: Record<string, unknown>;
  }

  export interface Vendor {
    id: number;
    registered: string;
    name: string;

    comment?: string;
    empty_spool_weight?: number;
    external_id?: string;
    extra?: Record<string, unknown>;
  }
}
