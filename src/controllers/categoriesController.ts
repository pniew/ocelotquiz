import express from 'express';
import Category from 'models/Category';

export default {
    index: async (req: express.Request, res: express.Response) => {
        const allCategories = await Category.getAll();
        const categories = allCategories.map(category => {
            if (category.subId !== null) {
                const topCategory = allCategories.find(cat => cat.id === category.subId);
                if (topCategory.subcategories === undefined) {
                    topCategory.subcategories = [];
                }
                topCategory.subcategories.push(category);
                return null;
            }
            delete category.subId;
            return category;
        }).filter(cat => cat !== null);

        res.render('categories/index', { title: 'Kategorie', categories: categories });
    }
};
