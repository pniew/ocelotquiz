import bcrypt from 'bcrypt';
import express from 'express';
import { createCryptoString } from 'common/utils';
import transporter from 'common/nodemailer';
import settingsCache from 'common/settingsCache';
import UserModel from 'models/UserModel';

const EMAIL_REGEXP = /^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+(\.[-!#$%&'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$/;

const sendActivationMail = (username: string, email: string, token: string) => {
    const mail = {
        from: `"Ocelot 🐱" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Aktywacja konta w serwisie Ocelot',
        text: 'Plain/text mail', // Informacja dla przestarzałych klientów pocztowych bez obsługi HTML, coś tu czeba podać
        template: 'profile/utils/activate',
        context: {
            name: username,
            token: token
        }
    };
    transporter.sendMail(mail, (error, info) => {
        if (error) {
            console.error(error.message);
            return;
        }

        console.log(`Message sent: ${info.messageId}`); // TODO: LOG SOMEWERE ELSE, AS IT MAY BE IMPORTANT IF ANY PROBLEMS OCCUR
    });
};

const redirectWithError = (req: express.Request, res: express.Response, key: string, message: string, returPath: string) => {
    if (req.session.errors === undefined) {
        req.session.errors = {};
    }
    req.session.errors.previousBody = req.body;
    req.session.errors[key] = { message };
    return res.redirect(returPath);
};

export default {
    // aktualnie lista wszystkich userów bo tak
    index: async (req: express.Request, res: express.Response) => {
        const user = await UserModel.getById(req.session.userid);
        res.render('profile/index', { title: 'Użytkownicy', user });
    },

    // rejestracja form
    create: async (req: express.Request, res: express.Response) => {
        const requiredPasswordLength = settingsCache.get('required-password-length');
        const errors = req.session.errors;
        delete req.session.errors;
        res.render('profile/register', { title: 'Rejestracja', errors, requiredPasswordLength });
    },

    // widok profilu?
    edit: async (req: express.Request, res: express.Response) => {
        res.send();
    },

    // rejestracja do DB
    store: async (req: express.Request, res: express.Response) => {
        if (req.body.username === undefined || req.body.username.length === 0) {
            return redirectWithError(req, res, 'username', 'Nie podano nazwy użytkownika!', '/register');
        }

        const requiredPasswordLength = settingsCache.get('required-password-length');
        if (req.body.password === undefined || req.body.password.length < requiredPasswordLength) {
            return redirectWithError(req, res, 'password', `Podane hasło jest zbyt krótkie, minimalnie ${requiredPasswordLength} znaków!`, '/register');
        }

        if (req.body.email === undefined || !EMAIL_REGEXP.test(req.body.email)) {
            return redirectWithError(req, res, 'email', 'Podany adres email jest nieprawidłowy!', '/register');
        }

        const user = await UserModel.getByName('req.body.username');
        if (user) {
            return redirectWithError(req, res, 'username', 'Podany login zajęty!', '/register');
        }

        const token = createCryptoString(20);
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const hashedToken = await bcrypt.hash(token, 10);
        const timestamp = new Date().getTime();

        const userid = await UserModel.insert({
            username: req.body.username,
            email: req.body.email,
            activationToken: `${timestamp}:${hashedToken}`,
            password: hashedPassword
        });
        sendActivationMail(req.body.username, req.body.email, token);

        req.session.loggedIn = true;
        req.session.userid = userid;
        res.redirect('/');
    },

    // update profilu
    update: async (req: express.Request, res: express.Response) => {
        res.send();
    },

    // usunięcie profilu
    destroy: async (req: express.Request, res: express.Response) => {
        res.send();
    },

    // form logowania (może na str głównej?)
    login: async (req: express.Request, res: express.Response) => {
        const errors = req.session.errors;
        delete req.session.errors;
        res.render('profile/login', { title: 'Logowanie', errors });
    },

    // logowanie z DB
    auth: async (req: express.Request, res: express.Response) => {
        const user = await UserModel.getByName(req.body.username);
        if (!user) {
            return redirectWithError(req, res, 'username', 'Nie znaleziono użytkownika o takiej nazwie!', '/login');
        }

        if (!await bcrypt.compare(req.body.password, user.password)) {
            return redirectWithError(req, res, 'password', 'Hasło nieprawidłowe!', '/login');
        }
        req.session.loggedIn = true;
        req.session.userid = user.id;
        res.redirect('/');
    },

    activate: async (req: express.Request, res: express.Response) => {
        const user = await UserModel.getByName(req.params.username);
        if (!user) {
            return res.render('error', { error: { message: 'Nie znaleziono użytkownika o takiej nazwie!' } });
        }

        const [timestamp, token] = user.activationToken.split(':');
        if (!await bcrypt.compare(req.params.token, token)) {
            return res.render('error', { error: { message: 'Nieprawidłowy token!' } });
        }

        if (new Date().getTime() - parseInt(timestamp) > settingsCache.get('account-activation-token-lifetime') * 1000) {
            return res.render('error', { error: { message: 'Token wygasł!' } });
        }

        UserModel.editById(user.id, { status: '1' });
        res.redirect('/');
    },

    logout: async (req: express.Request, res: express.Response) => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    }
};
