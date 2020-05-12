import { Category, ExtendedCategory } from 'models/CategoryModel';

export const categories: Category[] = [
    {
        id: 1,
        name: 'C1',
        description: 'string',
        parent: null
    },
    {
        id: 2,
        name: 'C2',
        description: 'string2',
        parent: null
    },
    {
        id: 3,
        name: 'C1a',
        description: 'string3',
        parent: 1
    },
    {
        id: 4,
        name: 'C1b',
        description: 'string4',
        parent: 1
    }
];

export const categoryTree: ExtendedCategory[] = [
    {
        id: 1,
        name: 'C1',
        description: 'string',
        subcategories: [
            { id: 3, name: 'C1A', description: 'string3', parent: 1 },
            { id: 4, name: 'C1B', description: 'string4', parent: 1 }
        ]
    },
    {
        id: 2,
        name: 'C2',
        description: 'string2'
    }
];
