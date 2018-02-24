#!/usr/bin/env node

/**
 * sample.ts
 * This is a sample `typescript` file for us with the grammar parser.
 *
 * It will contain a mix of stuff.
 */


// alias for uniqueFilterFnGenerator
export const uniqueFn = uniqueFilterFnGenerator;

export function uniqueFilterFnGenerator<T>(): (v: T) => boolean;
export function uniqueFilterFnGenerator<T, U>(extractFn: (v: T) => U): (v: T) => boolean;
export function uniqueFilterFnGenerator<T>(extractFn?: (v: T) => T): (v: T) => boolean {
    const values = new Set<T>();
    const extractor = extractFn || (a => a);
    return (v: T) => {
        const vv = extractor(v);
        const ret = !values.has(vv);
        values.add(vv);
        return ret;
    };
}

export function unique<T>(src: T[]): T[] {
    return [...(new Set(src))];
}

function main() {
    console.log('Hello World.');

    const values = [1, 2, 3, 3, 4, 2, 5, 6];
    console.log(values);
    console.log(unique(values));
}

main();
