// Firefox browser API declaration - ambient module
declare const browser: typeof chrome | undefined;

// Node.js global for tests
declare const global: typeof globalThis;

// CSS Module declarations
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// CSS Module with ?inline query (returns raw CSS string)
declare module '*.module.css?inline' {
  const css: string;
  export default css;
}

// Regular CSS with ?inline query
declare module '*.css?inline' {
  const css: string;
  export default css;
}
