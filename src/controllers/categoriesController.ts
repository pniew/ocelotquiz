import express from 'express';
import CategoryModel, { Category, Top } from 'models/CategoryModel';

interface CreateEditCategoryView {
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
    listAll: async (req: express.Request, res: express.Response) => {
        const allCategories = await CategoryModel.getAllOrdered();

        res.render('categories/listAll', { title: 'Lista kategorii', allCategories });
    },

    edit: async (req: express.Request, res: express.Response) => {
        const categoryId = parseInt(req.params.id);

        const allCategories = await CategoryModel.getAllOrdered();
        const topCategory = categoryId ? allCategories.find(c => c.id === categoryId) : Top;
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
                if (!path.find(x => x.id === Top.id)) { path.unshift(Top); }
                break;
            }
        }

        const subCategories = categoryId ? await CategoryModel.getByParent(categoryId) : await CategoryModel.getTopCategories();

        const options: CreateEditCategoryView = {
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

    actionCreate: async (req: express.Request, res: express.Response) => {
        const category: Category = req.body.category;
        if (parseInt(category.parent as any) === 0) {
            category.parent = null;
        }

        delete category.id;
        category.name = category.name.toUpperCase();

        await CategoryModel.insert(category);

        res.redirect(`/category/${category.parent}`);
    },

    actionUpdate: async (req: express.Request, res: express.Response) => {
        const categoryId = parseInt(req.params.id);
        const category = req.body.category as Category;
        if (categoryId === parseInt(category.parent as any)) {
            // Handle move error, cannot move to itself
            res.redirect(`/category/${categoryId}`);
            return;
        }
        delete category.id;
        category.name = category.name.toUpperCase();

        if (parseInt(category.parent as any) === 0) {
            category.parent = null;
        }

        await CategoryModel.editById(categoryId, category);

        if (req.headers['x-async-action']) {
            return res.status(200);
        }

        res.redirect(`/category/${categoryId}`);
    },

    actionDelete: async (req: express.Request, res: express.Response) => {
        const categoryId = parseInt(req.params.id);
        const parentId = parseInt(req.params.parent);

        await CategoryModel.editByParent(categoryId, { parent: 1 });
        await CategoryModel.deleteById(categoryId);

        if (req.headers['x-async-action']) {
            return res.status(200);
        }

        res.redirect(`/category/${parentId}`);
    }
};
