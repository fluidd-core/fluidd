export interface ChartConfiguration {
  HISTORY_RETENTION: number;
  COLORS: ChartColors;
}

export interface ChartColors {
  NAMED: ChartNamedColors;
}

export interface ChartNamedColors {
  [key: string]: string;
}
