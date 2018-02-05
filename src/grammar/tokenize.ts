import { GrammarDefinition, Pattern, RegexOrString } from './grammarDefinition';
import { isPatternInclude, isPatternMatch, isPatternBeginEnd, scope, captures } from './pattern';
import * as XRegExp from 'xregexp';

const maxDepth = 10;

export interface TokenizeLineResult {
    tokens: Token[];
    state: TokenizerState;
}

export interface TokenizerState extends Rule {
    readonly depth: number;
}

export interface Token {
    readonly startIndex: number;
    readonly endIndex: number;
    readonly scopes: string[];
}

export interface TokenizeIterator extends IterableIterator<string> {
    next: (line: string) => IteratorResult<string>;
    [Symbol.iterator]: () => TokenizeIterator;
}

export interface Rule {
    readonly grammarDef: GrammarDefinition;
    readonly pattern: Pattern;
    readonly end?: RegExp;
    readonly parent?: Rule;
    readonly depth: number;
    readonly scope: string | undefined;
}

export interface MatchResult {
    match?: RegExpExecArray;
    rule: Rule;
}

export function matchRule(text: string, offset: number, rule: Rule): MatchResult {
    const { pattern, depth, grammarDef } = rule;
    if ( isPatternInclude(pattern) ) {
        if (depth < maxDepth && grammarDef.repository) {
            const name = pattern.include.slice(1);
            const result = grammarDef.repository[name];
            if (result) {
                return matchRule(text, offset, { grammarDef, pattern: result, parent: rule, depth: depth + 1, scope: scope(result) });
            }
            if (pattern.include === '^self') {
                return matchRule(text, offset, { grammarDef, pattern: rule.pattern, parent: rule, depth: depth + 1, scope: scope(rule.pattern) });
            }
            // We do not support including other grammars yet.
        }
        return { rule }; // Unsupported include, match nothing.
    }
    if ( isPatternMatch(pattern) ) {
        const regex = regExpOrStringToRegExp(pattern.match);
        return { match: XRegExp.exec(text, regex, offset), rule };
    }
    if ( isPatternBeginEnd(pattern) ) {
        const regex = regExpOrStringToRegExp(pattern.begin);
        const match = XRegExp.exec(text, regex, offset);
        return { match, rule };
    }

    const candidates = pattern.patterns
        .map(pattern => matchRule(text, offset, { grammarDef, pattern, parent: rule, depth: depth + 1, scope: scope(pattern) }))
        .filter(m => !!m.match);

    return candidates.reduce((a, b) => {
        if (!b.match) {
            return a;
        }
        if (!a.match) {
            return b;
        }
        return (a.match.index < b.match.index) ? a : b;
    }, { rule });
}

export function tokenizeLine(text: string, rule: Rule): TokenizeLineResult {
    const tokens: Token[] = [];
    let offset = 0;
    let end = rule.end;
    let endMatch = end ? XRegExp.exec(text, end, offset) : undefined;
    let endOffset = endMatch ? endMatch.index : text.length;
    while (offset < text.length) {
        const { match, rule: matchingRule } = matchRule(text, offset, rule);
        if (match && match.index < endOffset) {
            if (match.index > offset) {
                tokens.push({ startIndex: offset, endIndex: match.index, scopes: extractScopes(rule) });
            }
            tokens.push(...tokenizeCapture(matchingRule, match));
            offset = match.index + match[0].length;
            const pattern = matchingRule.pattern;
            if (isPatternBeginEnd(pattern)) {
                rule = {
                    parent: matchingRule,
                    pattern: { patterns: pattern.patterns || [] },
                    grammarDef: matchingRule.grammarDef,
                    depth: matchingRule.depth + 1,
                    scope: undefined,
                    end: buildEndRegEx(pattern.end, match),
                };
                end = rule.end;
            }
            endMatch = end ? XRegExp.exec(text, end, offset) : undefined;
            endOffset = endMatch ? endMatch.index : text.length;
        }  else {
            tokens.push({ startIndex: offset, endIndex: endOffset, scopes: extractScopes(rule) });
            offset = endOffset;
            if (endOffset !== text.length) {
                do {
                    rule = rule.parent!;
                } while (!isPatternBeginEnd(rule.pattern));
                if (endMatch) {
                    tokens.push(...tokenizeCapture(rule, endMatch));
                    offset = endMatch.index + endMatch[0].length;
                    rule = rule.parent!;
                }
                while (rule.parent && !isPatternBeginEnd(rule.pattern)) {
                    rule = rule.parent!;
                }
                endMatch = rule.end ? XRegExp.exec(text, rule.end, offset) : undefined;
                endOffset = endMatch ? endMatch.index : text.length;
            }
        }
    }

    return {
        tokens,
        state: rule,
    };
}

function regExpOrStringToRegExp(regex: RegexOrString): RegExp {
    if (typeof regex === 'string') {
        return XRegExp(regex, 'x');
    }
    return XRegExp(regex);
}

function buildEndRegEx(regex: RegexOrString, match: RegExpExecArray): RegExp | undefined {
    if (!match) {
        return undefined;
    }
    if (typeof regex === 'string') {
        return XRegExp.build(regex, match, 'x');
    }
    return regex;
}

function extractScopes(rule: Rule): string[] {
    const values: string[] = [];

    let r: Rule | undefined = rule;

    while (r) {
        if (r.scope) {
            values.push(r.scope);
        }
        r = r.parent;
    }

    return values.reverse();
}

function tokenizeCapture(rule: Rule, match: RegExpExecArray): Token[] {
    const cap = captures(rule.pattern);
    const scopes = extractScopes(rule);
    let startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    const tokens: Token[] = [];

    if (cap) {
        const cc = new Map(Object.entries(cap));
        let q = 0;
        let p = q;
        const m0 = match[0];
        for (const [k, s] of Object.entries(match!)) {
            if (k === 'index' || k === 'input') { continue; }
            const n = m0.indexOf(s, p);
            if (n < 0 || n < p) { continue; }
            const f = n + s.length;

            const c = cc.get(k);
            if (c) {
                if (n > q) {
                    tokens.push({ startIndex: startIndex + q, endIndex: startIndex + n, scopes });
                }
                tokens.push({ startIndex: startIndex + n, endIndex: startIndex + f, scopes: scopes.concat([c.name])});
                q = f;
            }
            p = f;
        }
        if (q < m0.length) {
            tokens.push({ startIndex: startIndex + q, endIndex: startIndex + m0.length, scopes });
        }
        startIndex += m0.length;
    }

    if (startIndex < endIndex) {
        tokens.push({ startIndex, endIndex, scopes });
    }
    return tokens;
}
