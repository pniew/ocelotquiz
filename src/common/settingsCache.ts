import SettingModel from 'models/SettingModel';

class SettingCache {
    private cacheData: { key: string, value: any }[] = [];

    public async init(): Promise<void> {
        console.log('Initalizing settings cache.');
        for (const setting of await SettingModel.getAll()) {
            this.set(setting.key, setting.value);
            console.log(`${setting.key} => ${setting.value}`);
        }
    }

    public all(): { key: string, value: any }[] {
        return this.cacheData;
    }

    public clear(): void {
        this.cacheData = [];
    }

    public async reload(): Promise<void> {
        this.clear();
        this.init();
    }

    public get(key: string): any {
        return this.cacheData.find(el => el.key === key).value;
    }

    public set(key: string, value: any): void {
        const el = this.cacheData.find(el => el.key === key);
        if (el) {
            el.value = value;
        } else {
            this.cacheData.push({
                key: key,
                value: value
            });
        }
    }
}

export default new SettingCache();
