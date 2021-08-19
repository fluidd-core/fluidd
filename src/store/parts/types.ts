export interface PartsState {
  parts: { [key: string]: Part};
  excludedParts: string[];
}

export interface Part {
   name: string;
   xmin: number;
   ymin: number;
   xmax: number;
   ymax: number;
   xtarget: number;
   ytarget: number;
}