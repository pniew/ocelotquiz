import { User } from 'models/UserModel';

export const users: User[] = [{
    id: 1,
    email: 'patryk@checinski.dev',
    username: 'pchecinski',
    password: '1234',
    activationToken: 'abc123'
}, {
    id: 2,
    email: 'mail@example.com',
    username: 'example',
    password: 'examplepw',
    activationToken: 'exampleToken'
}];
