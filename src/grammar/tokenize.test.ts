import { expect } from 'chai';
import { GrammarDefinition } from './grammarDefinition';
import * as path from 'path';
import { Rule, tokenizeLine } from './tokenize';
// import * as XRegExp from 'xregexp';

describe('Validate Tokenizer', () => {


    it('tests tokenizeLine Javascript', () => {
        const lines = sampleJavascript.split('\n');
        let rule = sampleJavascriptGrammarRule;
        expect(lines).to.be.not.empty;
        for (const line of lines) {
            console.log(line);
            const r = tokenizeLine(line, rule);
            r.tokens.forEach(t => {
                const text = JSON.stringify(line.slice(t.startIndex, t.endIndex));
                const scope = t.scopes.join(', ');
                console.log(`${text} => ${scope}`);
            });
            rule = r.state;
        }
        expect(true).to.be.true;
    });

    it('tests tokenizeLine sampleFakeGrammar', () => {
        const rule = grammarToRule(sampleFakeGrammar);
        const r = tokenizeLine(`const x = 'it\\'s good'; // comment`, rule);
        console.log(r);
        // fix sub matches can push out the end of parent matches.
        expect(r.tokens).to.have.length(8);
    });

});

const sampleJavascriptGrammarRule = loadSampleJavascriptGrammar();
const sampleJavascript = `
"use strict";

function run(name) {
    const text = name + ' ' + name.toUpperCase();
    console.log(text);
}
`;

const sampleFakeGrammar: GrammarDefinition = {
    name: 'Sample Grammar',
    fileTypes: ['js'],
    scopeName: 'scope.js',
    patterns: [
        { include: '#comment' },
        { include: '#string' },
    ],
    repository: {
        comment: {
            patterns: [
                { include: '#comment-block-definition' },
                { include: '#comment-block' },
                { include: '#comment-line' },
            ]
        },
        'comment-block': {
            begin: '/\\*',
            captures: {
                '0': {
                    name: 'punctuation.definition.comment.json'
                }
            },
            end: '\\*/',
            name: 'comment.block.json'
        },
        'comment-block-definition': {
            begin: '/\\*\\*(?!/)',
            captures: {
                '0': {
                    name: 'punctuation.definition.comment.json'
                }
            },
            end: '\\*/',
            name: 'comment.block.documentation.json'
        },
        'comment-line': {
            captures: {
                '1': {
                    name: 'punctuation.definition.comment.js'
                }
            },
            match: '(//).*$\\n?',
            name: 'comment.line.double-slash.js'
        },
        'string': {
            'patterns': [
                {
                    'include': '#qstring-single'
                },
                {
                    'include': '#qstring-double'
                }
            ]
        },
        'qstring-double': {
            'name': 'string.quoted.double.js',
            'begin': '"',
            'beginCaptures': {
                '0': {
                    'name': 'punctuation.definition.string.begin.js'
                }
            },
            'end': '(")|((?:[^\\\\\\n])$)',
            'endCaptures': {
                '1': {
                    'name': 'punctuation.definition.string.end.js'
                },
                '2': {
                    'name': 'invalid.illegal.newline.js'
                }
            },
            'patterns': [
                {
                    'include': '#string-character-escape'
                }
            ]
        },
        'qstring-single': {
            'name': 'string.quoted.single.js',
            'begin': "'",
            'beginCaptures': {
                '0': {
                    'name': 'punctuation.definition.string.begin.js'
                }
            },
            'end': "(\\')|((?:[^\\\\\\n])$)",
            'endCaptures': {
                '1': {
                    'name': 'punctuation.definition.string.end.js'
                },
                '2': {
                    'name': 'invalid.illegal.newline.js'
                }
            },
            'patterns': [
                {
                    'include': '#string-character-escape'
                }
            ]
        },
        'string-character-escape': {
            'name': 'constant.character.escape.js',
            'match': '\\\\(x[0-9A-Fa-f]{2}|[0-2][0-7]{0,2}|3[0-6][0-7]?|37[0-7]?|[4-7][0-7]?|.|$)'
        },
    },
};


function loadSampleJavascriptGrammar(): Rule {
    const filenameGrammarJavascript = path.join(__dirname, '..', '..', 'samples', 'syntax', 'javascript.tmlangauge.json');
    const grammarJavascript = require(filenameGrammarJavascript) as GrammarDefinition;

    return grammarToRule(grammarJavascript);
}

function grammarToRule(grammar: GrammarDefinition): Rule {
    const rule: Rule = {
        parent: undefined,
        pattern: grammar,
        scope: grammar.scopeName,
        grammarDef: grammar,
        depth: 0,
    };

    return rule;
}
