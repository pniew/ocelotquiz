import express from 'express';
import fileUpload from 'express-fileupload';
import exphbs from 'express-handlebars';
// import mysqlSession from 'express-mysql-session';
import methodOverride from 'method-override';
import session from 'express-session';
import path from 'path';
import helpers from 'common/helpers';
import indexController from 'controllers/indexController';
import profileController from 'controllers/profileController';
import questionController from 'controllers/questionController';
import settingsController from 'controllers/settingsController';
import categoriesController from 'controllers/categoriesController';

import pool from 'common/database';
import settingsCache from 'common/settingsCache';
import quizController from './controllers/quizController';

// const MySQLStore = mysqlSession(session);
var MySQLStore = require('express-mysql-session')(session);

const port = process.env.SERVER_PORT;
const app = express();

app.engine('handlebars', exphbs({
    helpers
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'handlebars');

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    store: new MySQLStore({}, pool),
    saveUninitialized: false
}));

// if (process.env.NODE_ENV === 'development') {
//     // Debug Info
//     app.use((req, res, next) => {
//         console.log(new Date().toISOString());
//         console.log(req.url);
//         console.log(req.params);
//         console.log(req.session);
//         next();
//     });
// }

app.get('/', indexController.index);
app.get('/main', indexController.main);
app.get('/login', profileController.login);
app.post('/login', profileController.auth);
app.get('/register', profileController.create);
app.post('/register', profileController.store);
app.get('/logout', profileController.logout);
app.get('/activate/:username/:token', profileController.activate);

app.use((req, res, next) => {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
});

function isAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.session && req.session.isAdmin) {
        next();
    }
}

app.get('/profile', profileController.index);
app.get('/profile/:id', profileController.index);
app.get('/questions/admin/all', isAdmin, questionController.index);
app.get('/questions/admin/pending', isAdmin, questionController.pendingIndex);
app.post('/question/admin/pending/:id', isAdmin, questionController.pendingAction);
app.get('/questions', questionController.index);
app.get('/question/create', questionController.create);
app.get('/question/upload', questionController.upload);
app.post('/question', fileUpload(), questionController.store);
app.get('/question/canAdd', questionController.canAdd);
app.post('/question/pending/:id', questionController.pending);
app.post('/question/revoke/:id', questionController.revoke);
app.get('/question/:id', questionController.edit);
app.post('/question/:id', questionController.update);
app.delete('/question/:id', questionController.destroy);

app.get('/quiz', quizController.index);
app.post('/quiz/generate', quizController.generate);
app.get('/quiz/start', quizController.quiz);
app.post('/quiz/next', quizController.answerAction);

app.get('/categories', isAdmin, categoriesController.listAll);
app.get('/category/:id?', isAdmin, categoriesController.edit);
app.post('/category', isAdmin, categoriesController.actionCreate);
app.post('/category/:id', isAdmin, categoriesController.actionUpdate);
app.delete('/category/:id', isAdmin, categoriesController.actionDelete);

app.get('/settings', isAdmin, settingsController.index);
app.post('/settings', isAdmin, settingsController.update);

app.get('/*', (req: express.Request, res: express.Response) => {
    res.render('error', { error: { message: 'Strona nie istnieje' } });
});

settingsCache.init().then(() => {
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    });
});
