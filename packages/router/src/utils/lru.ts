export class LRUCache<K, V> {
  private _map = new Map<K, V>();
  private _limit: number;

  constructor(limit = 32) {
    this._limit = limit;
  }

  get(key: K): V | undefined {
    const value = this._map.get(key);
    if (value !== undefined) {
      this._map.delete(key);
      this._map.set(key, value);
    }
    return value;
  }

  getAndRemove(key: K): V | undefined {
    const value = this._map.get(key);
    if (value !== undefined) {
      this._map.delete(key);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this._map.has(key)) {
      this._map.delete(key);
    }
    this._map.set(key, value);
    while (this._map.size > this._limit) {
      const oldest = this._map.keys().next().value;
      if (oldest == null) break;
      this._map.delete(oldest);
    }
  }

  has(key: K): boolean {
    return this._map.has(key);
  }

  delete(key: K): boolean {
    return this._map.delete(key);
  }

  clear(): void {
    this._map.clear();
  }

  get size(): number {
    return this._map.size;
  }
}
