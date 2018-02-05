import {
    Pattern,
    PatternBeginEnd,
    PatternInclude,
    PatternMatch,
    PatternPatterns,
    Capture,
} from './grammarDefinition';

export function isPatternInclude(pattern: Pattern): pattern is PatternInclude {
    const { include = undefined } = pattern as PatternInclude;
    return include !== undefined;
}

export function isPatternMatch(pattern: Pattern): pattern is PatternMatch {
    const { match = undefined } = pattern as PatternMatch;
    return match !== undefined;
}

export function isPatternBeginEnd(pattern: Pattern): pattern is PatternBeginEnd {
    const { begin = undefined, end = undefined } = pattern as PatternBeginEnd;
    return begin !== undefined && end !== undefined;
}

export function isPatternPatterns(pattern: Pattern): pattern is PatternPatterns {
    const { patterns = undefined } = pattern as PatternPatterns;
    return patterns !== undefined;
}

export function scope(pattern: Pattern): string | undefined {
    if (isPatternMatch(pattern) || isPatternBeginEnd(pattern)) {
        return pattern.name;
    }
    if (isPatternPatterns(pattern)) {
        return pattern.scopeName;
    }
    return undefined;
}

export function captures(pattern: Pattern): Capture | undefined {
    if (isPatternMatch(pattern)) {
        return pattern.captures;
    }
    if (isPatternBeginEnd(pattern)) {
        return pattern.beginCaptures || pattern.captures;
    }
    return undefined;
}

export function endCaptures(pattern: Pattern): Capture | undefined {
    if (isPatternBeginEnd(pattern)) {
        return pattern.endCaptures || pattern.captures;
    }
    return undefined;
}
