import express from 'express';
import User from 'models/User';
import crypto from 'crypto';

export default {
    index: async (req: express.Request, res: express.Response) => {
        if (req.session.loggedIn) {
            const user = await User.getById(req.session.userid);
            const emailHash = crypto.createHash('md5').update(user.email.trim().toLowerCase()).digest('hex');
            res.render('index', { hideFrame: true, hideNavbar: true, hideFooter: true, loggedIn: true, user: user, emailHash });
        } else {
            res.render('index', { hideFrame: true, hideNavbar: true, hideFooter: true });
        }
    },

    main: async (req: express.Request, res: express.Response) => {
        const user = await User.getById(req.session.userid);
        res.render('pageIndex', { title: 'Index', user });
    }
};
