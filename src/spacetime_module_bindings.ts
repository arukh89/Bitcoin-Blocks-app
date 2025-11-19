// Temporary stub for frontend build without generated SpacetimeDB bindings

export type RemoteTables = any
export type RemoteReducers = any
export type Round = any
export type Guess = any
export type LogEvent = any
export type ChatMessage = any
export type PrizeConfig = any

type Table<T> = {
  onInsert: (cb: (ctx: any, row: T) => void) => () => void
  onUpdate: (cb: (ctx: any, oldRow: T, newRow: T) => void) => () => void
  iter: () => Iterable<T>
}

type DbSchema = {
  rounds: Table<Round>
  guesses: Table<Guess>
  logs: Table<LogEvent>
  chatMessages: Table<ChatMessage>
  prizeConfigs: Table<PrizeConfig>
  userStats: Table<any>
  checkins: Table<any>
}

export class DbConnection {
  db: DbSchema
  reducers: any
  constructor() {
    const makeTable = <T,>(): Table<T> => ({
      onInsert: (_cb: (ctx: any, row: T) => void) => () => {},
      onUpdate: (_cb: (ctx: any, oldRow: T, newRow: T) => void) => () => {},
      iter: () => [] as T[],
    })

    this.db = {
      rounds: makeTable<Round>(),
      guesses: makeTable<Guess>(),
      logs: makeTable<LogEvent>(),
      chatMessages: makeTable<ChatMessage>(),
      prizeConfigs: makeTable<PrizeConfig>(),
      userStats: makeTable<any>(),
      checkins: makeTable<any>(),
    }

    this.reducers = {
      createRound: (..._args: any[]) => {},
      submitGuess: (..._args: any[]) => {},
      endRoundManually: (..._args: any[]) => {},
      updateRoundResult: (..._args: any[]) => {},
      sendChatMessage: (..._args: any[]) => {},
      dailyCheckin: (..._args: any[]) => {},
    }
  }
  static builder() {
    return new Builder()
  }
}

class Builder {
  withUri(_uri: string) {
    return this
  }
  withModuleName(_name: string) {
    return this
  }
  onConnect(_cb: (...args: any[]) => void) {
    return this
  }
  onDisconnect(_cb: (...args: any[]) => void) {
    return this
  }
  onError(_cb: (error: unknown) => void) {
    return this
  }
  async build() {
    return new DbConnection()
  }
}
