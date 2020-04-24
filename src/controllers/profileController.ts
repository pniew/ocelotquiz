import bcrypt from 'bcrypt';
import express from 'express';
import { createCryptoString, saveSession } from 'common/utils';
import transporter from 'common/nodemailer';
import settingsCache from 'common/settingsCache';
import { SettingEnum } from 'src/common/constants';
import UserModel from 'models/UserModel';
import { OceSession } from 'src/models/OceSession';
import QuizRecordsModel from 'src/models/QuizRecordsModel';

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

const redirectWithError = async (req: express.Request, res: express.Response, key: string, message: string, returPath: string) => {
    const session = req.session as OceSession;
    if (session.errors === undefined) {
        session.errors = {};
    }
    session.errors.previousBody = req.body;
    session.errors[key] = { message };
    await saveSession(req);
    return res.redirect(returPath);
};

export default {
    // aktualnie lista wszystkich userów bo tak
    index: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const session = req.session as OceSession;
        const reqUserId = parseInt(req.params.id) || session.userId;
        const user = await UserModel.getById(reqUserId);

        if (!user || (user && !session.isAdmin && session.userId !== reqUserId && user.isProfilePublic === 0)) {
            return next();
        }

        let points = 0;
        const quizRecords = (await QuizRecordsModel.getByUserIdLimit(reqUserId, 15)).map(q => {
            points += q.points;
            return { ...q, created: new Date(q.created) };
        });

        res.render('profile/index', { title: `Profil - ${user.username}`, user, quizRecords, totalPoints: points });
    },

    // rejestracja form
    create: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const requiredPasswordLength = settingsCache.get(SettingEnum.requiredPasswordLength);
        const errors = session.errors;
        delete session.errors;
        res.render('profile/register', { title: 'Rejestracja', errors, requiredPasswordLength });
    },

    // widok profilu?
    edit: async (req: express.Request, res: express.Response) => {
        res.send();
    },

    // rejestracja do DB
    store: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        if (req.body.username === undefined || req.body.username.length === 0) {
            return redirectWithError(req, res, 'username', 'Nie podano nazwy użytkownika!', '/register');
        }

        const requiredPasswordLength = settingsCache.get(SettingEnum.requiredPasswordLength);
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

        const userId = await UserModel.insert({
            username: req.body.username,
            email: req.body.email,
            activationToken: `${timestamp}:${hashedToken}`,
            password: hashedPassword
        });
        sendActivationMail(req.body.username, req.body.email, token);

        session.loggedIn = true;
        session.userId = userId;
        await saveSession(req);
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
        const session = req.session as OceSession;
        const errors = session.errors;
        delete session.errors;
        await saveSession(req);
        res.render('profile/login', { title: 'Logowanie', errors });
    },

    // logowanie z DB
    auth: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const user = await UserModel.getByName(req.body.username);
        if (!user) {
            return redirectWithError(req, res, 'username', 'Nie znaleziono użytkownika o takiej nazwie!', '/login');
        }

        if (!await bcrypt.compare(req.body.password, user.password)) {
            return redirectWithError(req, res, 'password', 'Hasło nieprawidłowe!', '/login');
        }
        session.loggedIn = true;
        session.userId = user.id;
        session.isAdmin = <any>user.admin === 1;
        await saveSession(req);
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

        if (new Date().getTime() - parseInt(timestamp) > settingsCache.get(SettingEnum.accountActivationTokenLifetime) * 1000) {
            return res.render('error', { error: { message: 'Token wygasł!' } });
        }

        UserModel.editById(user.id, { status: '1' });
        await saveSession(req);
        res.redirect('/');
    },

    logout: async (req: express.Request, res: express.Response) => {
        req.session.destroy(() => {
            res.redirect('/');
        });
    }
};
