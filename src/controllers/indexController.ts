import express from 'express';
import crypto from 'crypto';
import UserModel from 'src/models/UserModel';
import { OceSession } from 'src/models/OceSession';

export default {
    index: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        if (session.loggedIn) {
            const user = await UserModel.getById(session.userId);
            const emailHash = crypto.createHash('md5').update(user.email.trim().toLowerCase()).digest('hex');
            res.render('index', { hideFrame: false, hideNavbar: false, hideFooter: true, loggedIn: true, user: user, emailHash });
        } else {
            res.render('index', { hideFrame: false, hideNavbar: true, hideFooter: true });
        }
    },

    main: async (req: express.Request, res: express.Response) => {
        const session = req.session as OceSession;
        const user = await UserModel.getById(session.userId);
        res.render('pageIndex', { title: 'Index', user });
    }
};
