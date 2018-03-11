import { SelectorSetting } from './selectorsDef';

const scopeSeparator = ' ';
const selectorSeparator = ',';
const selectorAncestorSeparator = /\s+/;
const nameSeparator = '.';

export type Scope = string;

/**
 * Calculate a mating score for the selector against the scope
 * @param scope The scope to match against
 * @param selector The css style set of selectors
 * @returns an array representing the match from most detailed to least detailed (child to parent).
 *   if no match is found, an empty array is returned.
 */
export function scoreSelector(
    scope: Scope,
    selector: string,
): number[] {
    const scopes = scope.split(scopeSeparator).reverse();
    const selectors = selector.split(selectorSeparator);

    const scores = selectors
        .map(s => s.trim().split(selectorAncestorSeparator).reverse())
        .map(selectors => {
            let p = 0;
            let s = selectors[p];
            const score: number[] = [];
            for (scope of scopes) {
                if (s !== undefined && scope.startsWith(s)) {
                    const c = scope[s.length];
                    if (c === undefined || c === nameSeparator) {
                        score.push(s.length);
                        p += 1;
                        s = selectors[p];
                    } else {
                        score.push(0);
                    }
                } else {
                    score.push(0);
                }
            }
            return p < selectors.length ? [] : score;
        });
    return scores.reduce((a, b) => compareScores(a, b) < 0 ? b : a, []);
}

/**
 * @description compare two score chains.
 * @param a score chain
 * @param b score chain
 * @returns 0 for equals, < 0 if a < b, > 0 if a > b
 */
export function compareScores(a: number[], b: number[]): number {
    if (a.length !== b.length) {
        return a.length - b.length;
    }

    for (let i = 0; i < a.length; ++i) {
        const diff = a[i] - b[i];
        if (diff) {
            return diff;
        }
    }
    return 0;
}

/**
 * Filter an array of selector settings.
 * @param scope The scope to filter the selectors against
 * @param selectors The set of selector settings to compare against the scope.
 * @returns the matching selectors in the order of lowest to highest matching score.
 */
export function rankSelectors(scope: Scope, selectors: SelectorSetting[]): SelectorSetting[] {
    const result = selectors
        .map(s => ({ score: scoreSelector(scope, s.selector), selector: s}))
        .filter(s => s.score && !!s.score.length)
        .sort((a, b) => compareScores(a.score, b.score))
        .map(s => s.selector);

    return result;
}

