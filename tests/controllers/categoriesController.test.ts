import sinon, { assert } from 'sinon';
import CategoryModel from 'models/CategoryModel';
import * as categoriesMock from '../mocks/categories.mock';
import settingsCache from 'common/settingsCache';
import * as settingsMock from 'settings.mock';
import * as Utils from 'src/common/utils';
import categoriesController from 'src/controllers/categoriesController';

describe('Categories Controller', () => {
    afterEach(() => { sinon.restore(); });

    beforeEach(() => {
        sinon.stub(settingsCache, 'cacheData' as any).value(settingsMock.settingsCache);
        sinon.stub(Utils, 'saveSession').resolves();
    });

    it('getOrCreatePrivate: should get named category', async () => {
        sinon.stub(CategoryModel, 'getByName').resolves(categoriesMock.categories.filter(c => c.name === 'C1')[0]);

        const category = await categoriesController.getOrCreatePrivate({ name: 'C1', description: undefined });

        assert.match(category, { id: 1, name: 'C1', description: 'string', parent: null });
    });

    it('getOrCreatePrivate: should get category by id', async () => {
        sinon.stub(CategoryModel, 'getById').resolves(categoriesMock.categories.filter(c => c.id === 1)[0]);

        const category = await categoriesController.getOrCreatePrivate({ id: 1, name: undefined, description: undefined });

        assert.match(category, { id: 1, name: 'C1', description: 'string', parent: null });
    });

    it('getOrCreatePrivate: should create new category when cannot find any by name', async () => {
        sinon.stub(CategoryModel, 'getByName').resolves(undefined);
        sinon.stub(CategoryModel, 'insert').resolves(6);

        const category = await categoriesController.getOrCreatePrivate({ name: 'CAT', description: '' });

        assert.match(category, { id: 6, name: 'CAT', description: '', parent: 33 });
    });
});
