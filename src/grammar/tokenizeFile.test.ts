import { expect } from 'chai';
import { create } from './fixtures';
import { Grammar } from './grammar';
import { tokenizeFile } from './tokenizeFile';
import * as cacheMap from './cacheMap';

const updateSchemas = false;
const fixtureHelper = create();
fixtureHelper.enableWriteBack = updateSchemas;

function pathToSyntax(name: string) {
    return fixtureHelper.resolveFixturePath('grammar', 'syntax', name);
}

function pathToSource(name: string) {
    return fixtureHelper.resolveFixturePath('grammar', 'src', name);
}

function toFixturePath(name: string) {
    return fixtureHelper.relativeFixturePath('grammar', 'tokenized', name);
}

describe('Validate tokenizeFile', function () {
    this.timeout(60000);
    const grammarCache = cacheMap.create((grammarName: string) => {
        return Grammar.createFromFile(pathToSyntax(grammarName));
    });

    function fetchGrammar(name: string) {
        return grammarCache.get(name);
    }

    it('test tokenizeFile', async () => {
        const tests = [
            ['sample.js', 'javascript.tmLanguage.json'],
            ['sample.ts', 'TypeScript.tmLanguage.json'],
        ];

        for (const [sample, grammarName] of tests) {
            const grammar = await fetchGrammar(grammarName)!;
            const fixtureName = sample + '.json';

            // for (let i = 0; i < 3; ++i) {
            //     await tokenizeFile(grammar, pathToSource(sample));
            // }
            const tokenizedResult = await tokenizeFile(grammar, pathToSource(sample));
            const json = JSON.stringify(tokenizedResult, null, 2);
            const comp = await fixtureHelper.compare(toFixturePath(fixtureName), json);
            expect(comp.actual).to.be.equal(comp.expected);
        }
    });
});
