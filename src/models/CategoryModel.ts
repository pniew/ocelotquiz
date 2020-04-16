import { Base, BaseModel } from './BaseModel';

export interface Category extends Base {
    parent?: number;
    name: string;
    description: string;
}

export interface ExtendedCategory extends Category {
    subcategories?: Object[];
    questionCount?: number;
}

export const Top: Category = {
    id: 0,
    name: 'Kategorie',
    description: 'Spis głównych kategorii.'
};

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
        const query = `SELECT * FROM \`${this.sqlTable}\` WHERE \`parent\` IS NULL ORDER BY name`;
        return await super.execute(query) as Category[];
    }

    public async getByParent(id: number) {
        return (await super.getByField('parent', id)).sort((a, b) => a.name.localeCompare(b.name));
    }

    public async getAllWithQuestionsCountGt(count: number = 0): Promise<ExtendedCategory[]> {
        return await super.execute('SELECT categories.id, categories.created, categories.parent, categories.name, categories.description, COUNT(que.id) AS questionCount FROM categories LEFT JOIN( SELECT * FROM questions WHERE questions.status = \'public\' ) AS que ON categories.id = que.category GROUP BY categories.id HAVING questionCount >= ? ORDER BY categories.name', [count]);
    }

    public async getTree() {
        const allCategories = (await this.getAllOrdered()).map(c => {
            return { ...c, name: c.name.toUpperCase() };
        });
        const categoryTree = allCategories.map((category: ExtendedCategory) => {
            if (category.parent !== null) {
                const topCategory: ExtendedCategory = allCategories.find(cat => cat.id === category.parent);
                if (topCategory.subcategories === undefined) {
                    topCategory.subcategories = [];
                }
                topCategory.subcategories.push(category);
                return null;
            }
            delete category.parent;
            return category;
        }).filter(cat => cat !== null);
        return categoryTree;
    }
}

export default new CategoryModel();
