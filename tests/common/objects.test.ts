import { assert } from 'sinon';
import { getObjectDifferences, createObjFromDiffs } from 'src/common/utils';

describe('Object Differences', () => {
    it('should find differences in overlapping keys', function () {
        const a = { val1: 1, val2: 2, val3: 3, val4: 99 };
        const b = { val1: 2, val2: 2, val4: 45 };
        const diffs = getObjectDifferences(a, b);

        const expectedDiffs = ['val1', 'val4'];

        assert.match(diffs, expectedDiffs);
    });

    it('should not find any differences in not overlapping objects', function () {
        const a = { val1: 1, val2: 2, val3: 3, val4: 99 };
        const b = { val3: 3, val2: 2, val5: 99 };
        const diffs = getObjectDifferences(a, b);

        const expectedDiffs = [];

        assert.match(diffs, expectedDiffs);
    });

    it('should create new object from differing values of matching keys', function () {
        const a = { val1: 1, val2: 2, val3: 3, val4: 99 };
        const b = { val1: 2, val2: 2, val4: 45 };
        const newObj = createObjFromDiffs(a, b);

        const expectedObj = { val1: 2, val4: 45 };

        assert.match(newObj, expectedObj);
    });
});
