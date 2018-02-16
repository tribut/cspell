import { GrammarDefinition, Pattern, RegexOrString, Capture, PatternName } from './grammarDefinition';
import { isPatternInclude, isPatternMatch, isPatternBeginEnd, scope, captures, endCaptures, isPatternName } from './pattern';
import * as XRegExp from 'xregexp';
import { escapeMatch, MatchOffsetResult, matchesToOffsets } from './regexpUtil';

const maxDepth = 100;

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
        const { regex, sticky } = regExpOrStringToRegExp(pattern.match);
        try {
            return { match: XRegExp.exec(text, regex, offset, sticky), rule };
        } catch (e) {
            console.log(e);
            return { rule };
        }
    }
    if ( isPatternBeginEnd(pattern) ) {
        try {
            const { regex, sticky } = regExpOrStringToRegExp(pattern.begin);
            return { match: XRegExp.exec(text, regex, offset, sticky), rule };
        } catch (e) {
            console.log(e);
            return { rule };
        }
    }
    if ( isPatternName(pattern) ) {
        return { match: XRegExp.exec(text, /.*/, offset, false), rule };
    }

    let best: MatchResult | undefined;
    for (const pat of pattern.patterns) {
        const m = matchRule(text, offset, { grammarDef, pattern: pat, parent: rule, depth: depth + 1, scope: scope(pat) });
        if (!best) {
            best = m;
        }
        if (m.match) {
            if (m.match.index === offset) {
                return m;
            }
            if (!best.match || m.match.index < best.match.index) {
                best = m;
            }
        }
    }
    if (!best) {
        best = {
            match: undefined,
            rule
        };
    }
    return best;
}

export function tokenizeLine(text: string, rule: Rule): TokenizeLineResult {
    const tokens: Token[] = [];
    let offset = 0;
    let end = rule.end;
    let endMatch = end ? XRegExp.exec(text, end, offset) : undefined;
    let endOffset = endMatch ? endMatch.index : text.length;
    while (offset < text.length) {
        const { match, rule: matchingRule } = matchRule(text, offset, rule);
        if (match && match.index <= endOffset) {
            if (match.index > offset) {
                tokens.push({ startIndex: offset, endIndex: match.index, scopes: extractScopes(rule) });
            }
            tokens.push(...tokenizeCapture(matchingRule, match, captures(matchingRule.pattern)));
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
                try {
                    endMatch = end ? XRegExp.exec(text, end, offset) : undefined;
                    endOffset = endMatch ? endMatch.index : text.length;
                } catch (e) {
                    console.log(e);
                    endMatch = undefined;
                    endOffset = text.length;
                }
                continue;
            }
        }  else {
            if (offset < endOffset) {
                tokens.push({ startIndex: offset, endIndex: endOffset, scopes: extractScopes(rule) });
            }
            offset = endOffset;
        }
        if (offset === endOffset) {
            if (rule.parent && endMatch) {
                rule = findBoundingRule(rule);
                tokens.push(...tokenizeCapture(rule, endMatch, endCaptures(rule.pattern)));
                offset = endMatch.index + endMatch[0].length;
            }
        }
        rule = findEndRule(rule);
        end = rule.end;
        try {
            endMatch = end ? XRegExp.exec(text, end, offset) : undefined;
            endOffset = endMatch ? endMatch.index : text.length;
        } catch (e) {
            console.log(e);
            endMatch = undefined;
            endOffset = text.length;
        }
    }

    return {
        tokens,
        state: rule,
    };
}

function findBoundingRule(rule: Rule): Rule {
    while (rule.parent && !isPatternBeginEnd(rule.pattern)) {
        rule = rule.parent!;
    }
    return rule;
}

function findEndRule(rule: Rule): Rule {
    while (rule.parent && !rule.end) {
        rule = rule.parent;
    }
    return rule;
}

const matchSlashG = /^\\G/;
const matchNegSlashG = '(?!\\G)';

function regExpOrStringToRegExp(regex: RegexOrString): { regex: RegExp, sticky?: boolean } {
    try {
        if (typeof regex === 'string') {
            if (matchSlashG.test(regex)) {
                return { regex: XRegExp(regex.replace(matchSlashG, '')), sticky: true };
            }
            return { regex: XRegExp(regex) };
        }
        return { regex: XRegExp(regex) };
    } catch (e) {
        console.log(e);
        return { regex: /.^/ };
    }
}

function buildEndRegEx(regex: RegexOrString, match: RegExpExecArray): RegExp | undefined {
    if (!match) {
        return undefined;
    }
    if (typeof regex === 'string') {
        const subs = escapeMatch(match);
        try {
            if (regex.startsWith(matchNegSlashG)) {
                regex = '(?<=.|^)|$';
            }
            return XRegExp.build(regex, subs);
        } catch (e) {
            console.log(e);
            return /.^/;
        }
    }
    return regex;
}

function extractScopes(rule: Rule): string[] {
    const values: string[] = [];

    let r: Rule | undefined = rule;

    while (r) {
        const { name = undefined } = r.pattern as PatternName;
        const scope = r.scope || name || undefined;
        if (scope) {
            values.push(...scope.split(' '));
        }
        r = r.parent;
    }

    return values.reverse();
}

function tokenizeCapture(rule: Rule, match: RegExpExecArray, cap: Capture | undefined): Token[] {
    const scopes = extractScopes(rule);
    let startIndex = match.index;
    const endIndex = startIndex + match[0].length;

    const tokens: Token[] = [];

    if (cap) {
        const text = match.input;
        const captures = pairCaptureGroupsToMatchOffsets([...Object.keys(cap)], matchesToOffsets(match));

        const capturedTokens = captures.map(g => {
            const patterns = g.captureGroups.filter(v => !!cap[v]).map(v => cap[v]);
            const capturedScopes = patterns
                .filter(isPatternName)
                .map(p => p.name.split(' '))
                .reduce((a, b) => a.concat(b), scopes);
            if (!patterns.length) { return []; }
            const pattern = patterns[patterns.length - 1];
            if (isPatternName(pattern)) {
                return [{
                    startIndex: g.begin,
                    endIndex: g.end,
                    scopes: capturedScopes,
                }];
            }
            return tokenizeLine(text.slice(g.begin, g.end), {
                parent: undefined,
                pattern,
                grammarDef: rule.grammarDef,
                depth: 0,
                scope: capturedScopes.join(' '),
            }).tokens.map(t => ({...t, startIndex: t.startIndex + g.begin, endIndex: t.endIndex + g.begin}));
        }).reduce((a, b) => a.concat(b), []);

        for (const token of capturedTokens) {
            if (startIndex < token.startIndex) {
                tokens.push({ startIndex, endIndex: token.startIndex, scopes });
            }
            tokens.push(token);
            startIndex = token.endIndex;
        }
    }

    if (startIndex < endIndex) {
        tokens.push({ startIndex, endIndex, scopes });
    }
    return tokens;
}

export interface CapturedSpan {
    captureGroups: string[];
    begin: number;
    end: number;
}

export function pairCaptureGroupsToMatchOffsets(captureGroups: string[], match: MatchOffsetResult): CapturedSpan[] {
    let result: CapturedSpan[] = [];
    const sortedGroups = captureGroups
        .filter(g => match.has(g))
        .map(captureGroup => ({ ...match.get(captureGroup)!, captureGroup }))
        .sort((a, b) => a.begin - b.begin || b.end - a.end);

    const foundMatches: CapturedSpan[] = sortedGroups.map(g => {
        return {
            ...g,
            captureGroups: sortedGroups.filter(sg => sg.end >= g.end && sg.begin <= g.begin).map(sg => sg.captureGroup),
        };
    });

    let src: CapturedSpan[] = [];
    for (let group of foundMatches) {
        src = result;

        // back up to find the right position
        let p = src.length;
        while (p > 0 && src[p - 1].end >= group.begin) {
            p -= 1;
        }

        result = src.slice(0, p);

        // fix up rolling forwards
        // It is possible to remove multiple entries or add one entry.
        for (const active of src.slice(p)) {
            const toAdd = [
                {...active, end: group.begin }, // before
                group, // middle
            ].filter(a => a.begin < a.end);
            result.push(...toAdd);
            group = {...active, begin: group.end };
        }

        if (group.begin < group.end) {
            result.push(group);
        }
    }
    return result;
}
