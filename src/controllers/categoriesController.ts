import express from 'express';
import CategoryModel, { Category } from 'models/CategoryModel';

interface EditCategoryView {
    title: string;
    allCategories: Category[];
    topCategory: Category;
    subCategories: Category[];
    breadcrumbs: Category[];
    hideHeader: boolean;
    hideModifyButtons: boolean;
    topMostLevel: boolean;
}

export default {
    index: async (req: express.Request, res: express.Response) => {
        const allCategories = await CategoryModel.getAllOrdered();
        const categories = allCategories.map(category => {
            if (category.parent !== null) {
                const topCategory = allCategories.find(cat => cat.id === category.parent);
                if (topCategory.subcategories === undefined) {
                    topCategory.subcategories = [];
                }
                topCategory.subcategories.push(category);
                return null;
            }
            delete category.parent;
            return category;
        }).filter(cat => cat !== null);

        res.render('categories/index', { title: 'Lista kategorii', categories, allCategories });
    },

    edit: async (req: express.Request, res: express.Response) => {
        const id = parseInt(req.params.id);

        const head: Category = {
            id: 0,
            name: 'Kategorie',
            description: 'Spis głównych kategorii.'
        };

        const allCategories = await CategoryModel.getAllOrdered();
        const topCategory = id ? allCategories.find(c => c.id === id) : head;
        const path: Category[] = [];
        if (!topCategory.parent) {
            topCategory.parent = 0;
        }

        let last = topCategory;
        let depth = 0;
        while (last && !path.find(x => x.id === last.id) && depth++ < 10) {
            path.unshift(last);
            if (last.parent) {
                last = allCategories.find(c => c.id === last.parent);
            } else {
                if (!path.find(x => x.id === head.id)) { path.unshift(head); }
                break;
            }
        }

        const subCategories = id ? await CategoryModel.getByParent(id) : await CategoryModel.getTopCategories();

        const options: EditCategoryView = {
            title: 'Kategorie',
            topCategory,
            subCategories,
            allCategories,
            breadcrumbs: path,
            hideHeader: true,
            hideModifyButtons: path.length <= 1,
            topMostLevel: path.length <= 1
        };

        res.render('categories/edit', options);
    },

    create: async (req: express.Request, res: express.Response) => {
        const category: Category = req.body.category;
        if (parseInt(category.parent as any) === 0) {
            category.parent = null;
        }
        delete category.id;

        await CategoryModel.insert(category);

        res.redirect(`/category/${category.parent}`);
    },

    update: async (req: express.Request, res: express.Response) => {
        const id = parseInt(req.params.id);
        const category: Category = req.body.category;
        if (id === parseInt(category.parent as any)) {
            // Handle move error, cannot move to itself
            res.redirect(`/category/${id}`);
            return;
        }
        delete category.id;

        if (parseInt(category.parent as any) === 0) {
            category.parent = null;
        }

        await CategoryModel.editById(id, category);

        res.redirect(`/category/${id}`);
    },

    delete: async (req: express.Request, res: express.Response) => {
        const id = parseInt(req.params.id);
        const parent = parseInt(req.body.parentId);

        await CategoryModel.editByParent(id, { parent: 1 });
        await CategoryModel.deleteById(id);

        res.redirect(`/category/${parent}`);
    }
};
