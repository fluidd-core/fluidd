export interface ChartState {
  ready: boolean; // chart is ready, and we've process the initial store data.
  chart: ChartData[]; // chart data
  selectedLegends: ChartSelectedLegends;
}

export interface ChartData {
  [key: string]: number | Date;
  date: Date;
}

export interface ChartSelectedLegends {
  [key: string]: boolean;
}
