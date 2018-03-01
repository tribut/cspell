import { expect } from 'chai';
import { create } from './fixtures';
import { Grammar } from './grammar';
import { tokenizeFile } from './tokenizeFile';

const updateSchemas = false;
const fixtureHelper = create();
const grammarJavascript = Grammar.createFromFile(pathToSyntax('javascript.tmLanguage.json'));

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
    this.timeout(5000);

    it('test tokenizeFile', async () => {
        const grammar = await grammarJavascript;
        const sample = 'sample.js';
        const fixtureName = sample + '.json';

        const tokenizedResult = await tokenizeFile(grammar, pathToSource(sample));
        const json = JSON.stringify(tokenizedResult, null, 2);
        const comp = await fixtureHelper.compare(toFixturePath(fixtureName), json);
        expect(comp.actual).to.be.equal(comp.expected);
    });
});
