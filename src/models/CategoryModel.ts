import { Base, BaseModel } from './BaseModel';

export interface Category extends Base {
    parent?: number;
    subcategories?: [Object?];
    name: string;
    description: string;
}

class CategoryModel extends BaseModel<Category> {
    public readonly sqlTable = 'categories';

    public async getAllOrdered() {
        const query = `SELECT * FROM \`${this.sqlTable}\` ORDER BY \`name\` ASC`;
        return await super.execute(query);
    }

    public async editByParent(id: number, data: Category | { [key: string]: string | number }) {
        return await super.editByField('parent', id, data);
    }

    public async getTopCategories() {
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`parent\` IS NULL`;
        return await super.execute(query) as Category[];
    }

    public async getByParent(id: number) {
        return (await super.getByField('parent', id)).sort((a, b) => a.name.localeCompare(b.name));
    }
}

export default new CategoryModel();
