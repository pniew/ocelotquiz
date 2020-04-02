import express from 'express';
import crypto from 'crypto';
import UserModel from 'src/models/UserModel';

export default {
    index: async (req: express.Request, res: express.Response) => {
        if (req.session.loggedIn) {
            const user = await UserModel.getById(req.session.userid);
            const emailHash = crypto.createHash('md5').update(user.email.trim().toLowerCase()).digest('hex');
            res.render('index', { hideFrame: false, hideNavbar: false, hideFooter: true, loggedIn: true, user: user, emailHash });
        } else {
            res.render('index', { hideFrame: false, hideNavbar: true, hideFooter: true });
        }
    },

    main: async (req: express.Request, res: express.Response) => {
        const user = await UserModel.getById(req.session.userid);
        res.render('pageIndex', { title: 'Index', user });
    }
};
