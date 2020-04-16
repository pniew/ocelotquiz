import express from 'express';
import SettingModel from 'models/SettingModel';
import settingsCache from 'common/settingsCache';
import { saveSession } from 'src/common/utils';

export default {
    index: async (req: express.Request, res: express.Response) => {
        res.render('settings', { title: 'Ustawienia aplikacji', appSettings: await SettingModel.getAll() });
    },

    update: (req: express.Request, res: express.Response) => {
        if (req.body.data) {
            for (const setting of req.body.data) {
                if (settingsCache.get(setting.key) !== setting.value) {
                    console.log(`App setting "${setting.key}" changed! ${settingsCache.get(setting.key)} => ${setting.value}.`);
                    SettingModel.editByKey(setting.key, { value: setting.value });
                    settingsCache.set(setting.key, setting.value);
                }
            }
        }
        saveSession(req);
        res.redirect('/settings');
    }
};
