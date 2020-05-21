import * as immer from 'immer'

// Migrations is an object with number keys.
// Each key corresponds to a schemaVersion "X".
// The corresponding value is a function that takes a state with version "X-1"
// and applies changes to it, so that it now conforms to version "X".
export type Migrations = {
  [nextVersion: number]: Migration
}

// A Migration is a function that takes the previous state, and mutates it,
// so it conforms to a new schema version.
// Alternatively, the Migration may return a new State object to replace the previous one.
export type Migration = (
  previousState: VersionedState & Record<string, any>
) => any | void

// A state object from a previous version of the app.
// We know nothing about the state, except that is has a schema version.
export type VersionedState = { schemaVersion: number }

export async function loadAndMigrateState({
  migrations,
  loadVersionedState,
  targetSchemaVersion,
}: {
  migrations: Migrations
  loadVersionedState(schemaVersion: number): Promise<VersionedState>
  targetSchemaVersion: number
}): Promise<VersionedState | undefined> {
  // prevent searching for negative versions
  if (targetSchemaVersion < 0) return undefined

  // See if a state with the given schema is already stored. If so, return it.
  const persitedState = await loadVersionedState(targetSchemaVersion)
  if (persitedState) return persitedState

  // Otherwise, see if we find an older state and can migrate from that, recursively
  const previousState = await loadAndMigrateState({
    migrations,
    targetSchemaVersion: targetSchemaVersion - 1,
    loadVersionedState: loadVersionedState,
  })

  // If there's no previous state, we can't return anything
  if (!previousState) return undefined

  // Otherwise, run the migration for the next version against the previous state
  return immer.produce(previousState, (draft) => {
    migrations[targetSchemaVersion](draft)
    draft.schemaVersion = targetSchemaVersion
  })
}
