// Stub bindings placeholder. Replace with generated bindings via:
// spacetime generate client typescript --server maincloud \
//   --module bitcoin-blocks-app-v2 --out src/spacetime_module_bindings

type ConnectHandler = (token: string, identity: string, address: string) => void
type DisconnectHandler = (closeCode: number, closeReason: string) => void

class BuilderMock {
  withUri(_uri: string) { return this }
  withModuleName(_name: string) { return this }
  onConnect(_cb: ConnectHandler) { return this }
  onDisconnect(_cb: DisconnectHandler) { return this }
  async build(): Promise<never> {
    throw new Error('SpacetimeDB bindings not generated. See README/DEPLOYMENT_GUIDE.')
  }
}

export const DbConnection = {
  builder() {
    return new BuilderMock()
  }
}

export type RemoteTables = unknown
export type RemoteReducers = unknown
export type DbConnection = unknown
