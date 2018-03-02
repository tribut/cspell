

export interface Cache<K, V> extends Map<K, V> {}

export class CacheMap<K, V> extends Map<K, V> implements Cache<K, V> {
    constructor(readonly loader: (key: K) => V | undefined, entries?: Iterable<[K, V]>) {
        super(entries!);
    }

    get(key: K): V | undefined {
        if (!this.has(key)) {
            const value = this.loader(key);
            if (value === undefined) {
                return undefined;
            }
            this.set(key, value);
        }
        return super.get(key);
    }
}


export function create<K, T>(loader: (key: K) => T | undefined): Cache<K, T> {
    return new CacheMap(loader);
}
