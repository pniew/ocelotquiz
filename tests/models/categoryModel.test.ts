import sinon, { assert } from 'sinon';
import * as categoryMock from '../mocks/categories.mock';
import CategoryModel from 'src/models/CategoryModel';

describe('Category Model', () => {
    afterEach(() => { sinon.restore(); });
    it('should generate category tree', async function () {
        const categoryStub = sinon.stub(CategoryModel, 'getTree').resolves(categoryMock.categoryTree as any);

        const tree = await CategoryModel.getTree();

        assert.calledOnce(categoryStub);
        assert.match(tree, categoryMock.categoryTree);
    });
});
