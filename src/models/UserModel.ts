import { Base, BaseModel } from './BaseModel';

export interface User extends Base {
    email: string;
    activationToken: string;
    username: string;
    password: string;
    admin?: number; // 0 - default, 1 - admin
    isProfilePublic?: number;
}

class UserModel extends BaseModel<User> {
    public readonly sqlTable = 'users';

    public async getByName(name: string): Promise<User> {
        return (await super.getByField('username', name))[0];
    }
}

export default new UserModel();
