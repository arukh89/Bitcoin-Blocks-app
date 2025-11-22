// Shim for spacetimedb runtime/type exports expected by generated bindings
declare module 'spacetimedb' {
  // Value exports (treat as any to satisfy TS while using runtime package)
  export const AlgebraicType: any
  export class BinaryReader { constructor(...args: any[]) }
  export class BinaryWriter { constructor(...args: any[]) }
  export class ClientCache { constructor(...args: any[]) }
  export class ConnectionId { constructor(...args: any[]) }
  export class DbConnectionBuilder { constructor(...args: any[]) }
  export class DbConnectionImpl { constructor(...args: any[]) }
  export class Identity { constructor(...args: any[]) }
  export class SubscriptionBuilderImpl { constructor(...args: any[]) }
  export class TableCache<T = any> {
    constructor(...args: any[])
    count(): number
    iter(): Iterable<T>
    onInsert(cb: (ctx: any, row: T) => void): any
    removeOnInsert(cb: (ctx: any, row: T) => void): any
    onDelete(cb: (ctx: any, row: T) => void): any
    removeOnDelete(cb: (ctx: any, row: T) => void): any
    onUpdate(cb: (ctx: any, oldRow: T, newRow: T) => void): any
    removeOnUpdate(cb: (ctx: any, oldRow: T, newRow: T) => void): any
  }
  export class TimeDuration { constructor(...args: any[]) }
  export class Timestamp { constructor(...args: any[]) }
  export function deepEqual(a: any, b: any): boolean

  // Types used by generated code
  export type AlgebraicType = any
  export type AlgebraicTypeVariants = any
  export type CallReducerFlags = any
  export type ErrorContextInterface = any
  export type Event = any
  export type EventContextInterface = any
  export type ReducerEventContextInterface = any
  export type SubscriptionEventContextInterface = any
  export interface TableHandle<T = any> {}
}
