import express from 'express';
import Setting from 'models/Setting';
import settingsCache from 'common/settingsCache';

export default {
    index: async (req: express.Request, res: express.Response) => {
        res.render('settings', { title: 'Ustawienia aplikacji', appSettings: await Setting.getAll() });
    },

    update: (req: express.Request, res: express.Response) => {
        if (req.body.data) {
            for (const setting of req.body.data) {
                if (settingsCache.get(setting.key) !== setting.value) {
                    console.log(`App setting "${setting.key}" changed! ${settingsCache.get(setting.key)} => ${setting.value}.`);
                    Setting.editByKey(setting.key, { value: setting.value });
                    settingsCache.set(setting.key, setting.value);
                }
            };
        }
        res.redirect('/settings');
    }
};
