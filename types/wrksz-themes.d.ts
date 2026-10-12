/**
 * Local type declarations for @wrksz/themes.
 *
 * The published package's entry points (e.g. "@wrksz/themes/next") are not
 * resolvable via a bare "@wrksz/themes" module augmentation at type-check
 * time, which caused TS2664. Rather than fight the library's packaging,
 * this project declares the shape we actually use locally.
 */
declare module "@wrksz/themes" {
  export type DefaultTheme = string;
}

declare module "@wrksz/themes/next" {
  import type { ReactNode } from "react";
  export type ThemeProviderProps = {
    children?: ReactNode;
    attribute?: string;
    defaultTheme?: string;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    themes?: string[];
  };
  export function ThemeProvider(props: ThemeProviderProps): JSX.Element;
}
