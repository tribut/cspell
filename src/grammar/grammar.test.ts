import { Grammar } from './grammar';
import { expect } from 'chai';
import * as path from 'path';
import * as fs from 'fs-extra';


describe('Validate Grammar', () => {
    it('tests creating a Grammar from a file', async () => {
        const filename = path.join(__dirname, '..', '..', 'samples', 'syntax', 'javascript.tmlangauge.json');
        const grammar = await Grammar.createFromFile(filename);
        expect(grammar).instanceof(Grammar);
    });

    it('tests tokenizing a file', async () => {
        const filename = path.join(__dirname, '..', '..', 'samples', 'syntax', 'javascript.tmlangauge.json');
        const grammar = await Grammar.createFromFile(filename);
        const sampleFile = path.join(__dirname, '..', '..', 'samples', 'src', 'sample.js');
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
    });
});
