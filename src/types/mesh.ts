export interface MeshData {
  x: number[];
  y: number[];
  z: number[][];
  type: string;
  intensity: number[];
  cmin: number;
  cmax: number;
  showscale: boolean;
  autocolorscale?: boolean;
  colorscale?: string | Array<(number | string)[]>;
  colorbar: MeshColorBar;
}

export interface MeshColorBar {
  tickfont: { [key: string]: any };
}
