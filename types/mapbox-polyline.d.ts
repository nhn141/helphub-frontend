declare module '@mapbox/polyline' {
  export function decode(value: string, precision?: number): [number, number][];
  export function encode(points: [number, number][], precision?: number): string;
}
