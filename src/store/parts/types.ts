export interface PartsState {
  parts: { [key: string]: Part};
  excludedParts: string[];
  printState: string;
  currentPart?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface Part {
   name: string;
   outline: Point[];
   target: Point | null;
}

export interface PartObject {
  name: string;
  polygon: [number, number][];
  center: [number, number] | [number, number, number];
}
