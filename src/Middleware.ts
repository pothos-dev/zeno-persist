import { Middleware } from '@bearbytes/zeno'
import { VersionedState } from './Migrations'

export function createMiddleware<TState extends VersionedState>({
  writeVersionedState,
}: {
  writeVersionedState(state: TState): void
}) {
  // The created middleware can conform to any store with the correct State type, messages are irrelevant
  type Store = { state: TState; messages: any }
  const middleware: Middleware<Store> = (_) => (next) => (message) => {
    const nextState = next(message)
    // write the resulting state after each message was processed.
    // TODO batching, filtering, serializing
    writeVersionedState(nextState)
    return nextState
  }
  return middleware
}
