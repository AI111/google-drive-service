/**
 * Created by sasha on 19.10.16.
 */
export interface Map<K, V> {
    clear(): void;
    delete(key: K): boolean;
    forEach(callbackfn: (value: V, index: K, map: Map<K, V>) => void, thisArg?: any): void;
    get(key: K): V;
    has(key: K): boolean;
    set(key: K, value: V): Map<K, V>;
    size: number;
}
export declare var Map: {
    new <K, V>(): Map<K, V>;
    prototype: Map<any, any>;
}