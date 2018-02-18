import { Grammar } from './grammar';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';
import chalk, { Chalk } from 'chalk';

const javascriptGrammarFile = path.join(__dirname, '..', '..', 'samples', 'syntax', 'javascript.tmLanguage.json');
const sampleJavascriptFile = path.join(__dirname, '..', '..', 'samples', 'src', 'sample.js');

const golangGrammarFile = path.join(__dirname, '..', '..', 'samples', 'syntax', 'go.tmLanguage.json');
const sampleGolangFile = path.join(__dirname, '..', '..', 'samples', 'src', 'sample.go');

describe('Validate Grammar', () => {
    it('tests creating a Grammar from a file', async () => {
        const filename = javascriptGrammarFile;
        const grammar = await Grammar.createFromFile(filename);
        expect(grammar).instanceof(Grammar);
    });

    it('test tokenizing a GO file', async () => {
        const filename = golangGrammarFile;
        const grammar = await Grammar.createFromFile(filename);
        const sampleFile = sampleGolangFile;
        const file = await fs.readFile(sampleFile, 'utf8');
        for (const s of formatTokenizeText(file, grammar)) {
            console.log(s);
        }
    });

    it('tests tokenizing a javascript file', async () => {
        const filename = javascriptGrammarFile;
        const grammar = await Grammar.createFromFile(filename);
        const sampleFile = sampleJavascriptFile;
        const file = await fs.readFile(sampleFile, 'utf8');
        const tokenizer = grammar.tokenizer();
        for (const line of file.split('\n')) {
            const tokens = tokenizer.tokenize(line);
            let last = 0;
            for (const t of tokens) {
                expect(t.startIndex).to.be.eq(last);
                expect(t.scopes.length).to.be.at.least(1);
                expect(t.scopes[0]).to.be.eq('source.js');
                last = t.endIndex;
            }
            expect(last).to.be.eq(line.length);
        }
        for (const s of formatTokenizeText(file, grammar)) {
            console.log(s);
        }
    });

});

type ColorMap = [RegExp, Chalk][];

const colorMap: ColorMap = [
    [/ keyword/, chalk.yellow],
    [/ entity.name/, chalk.blue],
    [/ variable/, chalk.greenBright],
    [/ string/, chalk.yellowBright],
    [/comment/, chalk.dim.green],
    [/ punctuation/, chalk.yellow],
    [/support.function/, chalk.greenBright],
    [/^source$/, chalk.gray]
];

function colorize(text: string, scopes: string): string {
    for (const [reg, fn] of colorMap) {
        if (reg.test(scopes)) {
            return fn(text);
        }
    }
    return text;
}

function *formatTokenizeText(text: string, grammar: Grammar) {
    for (const tr of grammar.tokenizeText(text.split('\n'))) {
        const {line: rawLine, lineNumber, tokens} = tr;
        const line = rawLine.replace(/\t/g, ' ');
        yield `${lineNumber} ${line}`;
        const results = tokens.map(t => ({ text: line.slice(t.startIndex, t.endIndex), scopes: t.scopes.join(' ')}));
        const w = Math.max(...results.map(t => t.text.length));
        for (const {text, scopes} of results) {
            yield `  ${colorize(text.padEnd(w + 2), scopes)} => ${scopes}`;
        }
        yield '';
    }
}
