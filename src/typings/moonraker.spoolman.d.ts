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

  export interface FilamanPaginatedResponse {
    items?: FilamanSpool[];
  }

  export interface FilamanSpool {
    id: number;
    created_at?: string | null;
    last_used_at?: string | null;
    purchase_price?: number | null;
    remaining_weight_g?: number | null;
    initial_total_weight_g?: number | null;
    empty_spool_weight_g?: number | null;
    lot_number?: string | null;
    location_id?: number | null;
    custom_fields?: Record<string, unknown> | null;
    filament?: FilamanFilament | null;
  }

  export interface FilamanFilament {
    id: number;
    designation?: string | null;
    material_type?: string | null;
    price?: number | null;
    raw_material_weight_g?: number | null;
    default_spool_weight_g?: number | null;
    diameter_mm?: number | null;
    density_g_cm3?: number | null;
    manufacturer?: FilamanManufacturer | null;
    colors?: FilamanFilamentColor[] | null;
  }

  export interface FilamanFilamentColor {
    color?: {
      hex_code?: string | null;
    } | null;
  }

  export interface FilamanManufacturer {
    id?: number | null;
    name?: string | null;
    empty_spool_weight_g?: number | null;
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

  export type FilamentMultiColorDirection =
    | 'coaxial'
    | 'longitudinal'

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
    multi_color_direction?: FilamentMultiColorDirection;
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
