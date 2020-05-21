import { Migrations, VersionedState, loadAndMigrateState } from './Migrations'
import { StorageAdapter } from './StorageAdapter'
import { createMiddleware } from './Middleware'

export function createPersistence<T extends VersionedState>({
  initialState,
  migrations,
  storageAdapter,
}: {
  initialState: T
  migrations: Migrations
  storageAdapter: StorageAdapter
}) {
  validate({
    migrations,
    targetSchemaVersion: initialState.schemaVersion,
  })

  const middleware = createMiddleware<T>({
    writeVersionedState(state) {
      storageAdapter.set(`zeno-persist/v/${state.schemaVersion}`, state)
    },
  })
  async function restorePersistedState() {
    const restoredState = await loadAndMigrateState({
      targetSchemaVersion: initialState.schemaVersion,
      migrations,
      loadVersionedState(schemaVersion) {
        return storageAdapter.get<VersionedState>(
          `zeno-persist/v/${schemaVersion}`
        )
      },
    })

    return restoredState as T
  }

  return { middleware, restorePersistedState }
}

function validate({
  migrations,
  targetSchemaVersion,
}: {
  migrations: Migrations
  targetSchemaVersion: number
}) {
  // Validate that the migrations contain a value for each schema version.
  // TODO: should we do this?
  for (let i = 1; i < targetSchemaVersion; i++) {
    if (migrations[i] == undefined)
      throw Error(`No migration given for schema version ${i}`)
  }
}
