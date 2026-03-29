declare module 'culori' {
  export interface Oklch {
    mode: 'oklch';
    l?: number;
    c?: number;
    h?: number;
    alpha?: number;
  }

  export interface Rgb {
    mode: 'rgb';
    r?: number;
    g?: number;
    b?: number;
    alpha?: number;
  }

  export type Color = Oklch | Rgb | string | undefined;

  export function parse(color: string): Color;
  export function converter(mode: string): (color: Color) => Color;
  export const oklch: (color: Color) => Oklch | undefined;
}
