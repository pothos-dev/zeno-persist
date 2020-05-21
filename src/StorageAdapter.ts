export interface StorageAdapter {
  set<T>(key: string, data: T): Promise<void>
  get<T>(key: string): Promise<T>
}
