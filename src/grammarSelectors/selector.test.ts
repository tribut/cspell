import { expect } from 'chai';
import { compareScores, scoreSelector, rankSelectors } from './selector';
import { SelectorSetting } from './selectorsDef';


describe('Validate the selectors', () => {
    const selectorSource: SelectorSetting = { selector: 'source', enabled: false };
    const selectorEntity: SelectorSetting = { selector: 'entity.name', enabled: true };
    const selectorEntityFunction: SelectorSetting = { selector: 'entity.name.function', enabled: true };
    const selectorFunctionCall: SelectorSetting = { selector: 'meta.function-call entity.name.function', enabled: false };
    const selectorVariableDef: SelectorSetting = { selector: 'meta.definition variable', enabled: true };
    const selectors = [
        selectorSource,
        selectorEntity,
        selectorEntityFunction,
        selectorFunctionCall,
        selectorVariableDef,
    ];

    it('Tests compareScores', () => {
        expect(compareScores([], [])).to.be.equal(0);
        expect(compareScores([1], [2])).to.be.lessThan(0);
        expect(compareScores([0, 1], [0, 2])).to.be.lessThan(0);
        expect(compareScores([1, 1], [0, 2])).to.be.greaterThan(0);
        expect(compareScores([1, 1], [1, 1])).to.be.equal(0);
    });

    it('Tests scoreSelector', () => {
        const scope = 'source.ts meta.function.ts meta.definition.function.ts entity.name.function.ts';
        expect(scoreSelector(scope, 'entity.name')).to.be.deep.equal(['entity.name'.length, 0, 0, 0]);
        expect(scoreSelector(scope, 'entity.name ')).to.be.deep.equal(['entity.name'.length, 0, 0, 0]);
        expect(scoreSelector(scope, 'entity.nam')).to.be.deep.equal([]);
        expect(scoreSelector(scope, 'entity.name,entity.name.function')).to.be.deep.equal(['entity.name.function'.length, 0, 0, 0]);
        expect(scoreSelector(scope, 'entity.name,source.ts entity.name')).to.be.deep.equal(['entity.name'.length, 0, 0, 'source.ts'.length]);
        expect(scoreSelector(scope, 'meta')).to.be.deep.equal([0, 'meta'.length, 0, 0]);
        expect(scoreSelector(scope, 'source.ts meta entity.name')).to.be.deep.equal(['entity.name'.length, 'meta'.length, 0, 'source.ts'.length]);
        // Multiple spaces do not make a difference.
        expect(scoreSelector(scope, 'source.ts meta  entity.name')).to.be.deep.equal(['entity.name'.length, 'meta'.length, 0, 'source.ts'.length]);
        expect(scoreSelector(scope, 'source.ts meta meta entity.name'))
            .to.be.deep.equal(['entity.name'.length, 'meta'.length, 'meta'.length, 'source.ts'.length]);
    });

    it('Test rankSelectors', () => {
        expect(rankSelectors(
            'source.ts meta.function.ts meta.definition.function.ts entity.name.function.ts',
            selectors
        )).to.be.deep.equal([
            selectorSource,
            selectorEntity,
            selectorEntityFunction,
        ]);
        expect(rankSelectors(
            'source.ts',
            selectors
        )).to.be.deep.equal([
            selectorSource,
        ]);
        expect(rankSelectors(
            'source.ts meta.function.ts meta.return.type.ts meta.type.function.return.ts' +
            ' meta.object.type.ts meta.method.declaration.ts meta.block.ts meta.var.expr.ts' +
            ' meta.function-call.ts entity.name.function.ts',
            selectors
        )).to.be.deep.equal([
            selectorSource,
            selectorEntity,
            selectorEntityFunction,
            selectorFunctionCall,
        ]);
        expect(rankSelectors(
            'source.ts meta.function.ts meta.return.type.ts meta.type.function.return.ts' +
            ' meta.object.type.ts meta.method.declaration.ts meta.block.ts meta.var.expr.ts' +
            ' meta.var-single-variable.expr.ts meta.definition.variable.ts variable.other.readwrite.ts',
            selectors
        )).to.be.deep.equal([
            selectorSource,
            selectorVariableDef,
        ]);
    });
});
