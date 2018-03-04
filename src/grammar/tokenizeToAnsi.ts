import { Grammar, TokenizeLineResult } from './grammar';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Scope } from './grammarDefinition';

const defaultEncoding = 'utf8';
const defaultLineLength = 140;

export type ScopeColorizer = (text: string, scopes: Scope) => string;

function *splitLine(width: number, text: string): IterableIterator<string> {

    function *chunk(w: string) {
        while (w) {
            yield w.slice(0, width);
            w = w.slice(width);
        }
    }

    function *splitter(text: string) {
        const split = text.split(/\s+/);

        for (const word of split) {
            yield *chunk(word);
        }
    }

    let line = '';

    for (const word of splitter(text)) {
        if (line.length + word.length + 1 > width) {
            yield line;
            line = '';
        }
        line += ' ' + word;
    }

    if (line) {
        yield line;
    }
}

export function *tokenizeLine(colorize: ScopeColorizer, tokenizedLine: TokenizeLineResult): IterableIterator<string> {
    const { line, lineNumber, tokens } = tokenizedLine;
    const lineWidth = defaultLineLength;

    const clean = (t: string) => t.replace(/\t/g, ' ');

    const cLine = clean(line);
    yield `${lineNumber} ${colorize(cLine, 'source')}`;

    const results = tokens.map(t => ({ text: clean(line.slice(t.startIndex, t.endIndex)), scopes: t.scopes.join(' ') }));
    const w = Math.max(0, ...results.map(t => t.text.length));
    const leftPad = ' '.repeat(w + 4 + 4);
    const scopeWidth = lineWidth - leftPad.length;
    for (const {text, scopes} of results) {
        let prefix = `  ${colorize(text, scopes) + ' '.repeat(2 + w - text.length)} => `;
        for (const scope of splitLine(scopeWidth, scopes)) {
            yield `${prefix}${scope}`;
            prefix = leftPad;
        }
    }
    yield '';
}

export function *tokenizeText(grammar: Grammar, colorizer: ScopeColorizer, text: string) {
    for (const t of grammar.tokenizeLines(text.split(/\r?\n/))) {
        yield *tokenizeLine(colorizer, t);
    }
}

export async function tokenizeFile(grammar: Grammar, colorizer: ScopeColorizer, filename: string, encoding = defaultEncoding): Promise<string> {
    const text = await fs.readFile(filename, encoding);
    const name = path.basename(filename);

    return [
        `${name}`,
        '',
        ...tokenizeText(grammar, colorizer, text),
        ''
    ].join('\n');
}
