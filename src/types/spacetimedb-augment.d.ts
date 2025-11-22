// Augment spacetimedb types to match generated bindings
declare module 'spacetimedb' {
  // Fallback for generated bindings expecting TableHandle type
  export interface TableHandle<T = any> {}
}
