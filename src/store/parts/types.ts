export interface PartsState {
  parts: { [key: string]: Part};
  excludedParts: string[];
}

export interface Point {
  x: number;
  y: number;
}

export interface Part {
   name: string;
   outline: Point[];
   target: Point;
}