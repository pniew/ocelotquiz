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
import generatedQuizController from './controllers/generatedQuizController';
import examController from './controllers/examController';
import { OceSession } from './models/OceSession';
import { saveSession } from './common/utils';
import solveExamController from './controllers/solveExamController';
import tokenController from './controllers/tokenController';

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

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const session = req.session as OceSession;
    res.locals.isUserLogged = session.loggedIn === true;
    res.locals.isUserAdmin = session.isAdmin === true;
    next();
});

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

function isUserAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
    if (req.session && req.session.isAdmin) {
        next();
    }
}

app.get('/profile', profileController.index);
app.get('/profile/:id', profileController.index);
app.get('/questions/admin/all', isUserAdmin, questionController.index);
app.get('/questions/admin/pending', isUserAdmin, questionController.pendingIndex);
app.post('/question/admin/pending/:id', isUserAdmin, questionController.pendingAction);
app.get('/questions', questionController.index);
app.delete('/questions', questionController.remove);
app.get('/question/create', questionController.create);
app.get('/question/upload', questionController.upload);
app.post('/question', fileUpload(), questionController.store);
app.get('/question/canAdd', questionController.canAdd);
app.post('/question/pending/:id', questionController.pending);
app.post('/question/revoke/:id', questionController.revoke);
app.get('/question/:id', questionController.edit);
app.post('/question/:id', questionController.update);
app.delete('/question/:id', questionController.destroy);

app.get('/exam/:examId/tokens', tokenController.fetchAction);
app.post('/exam/:examId/token', tokenController.generateAction);
app.delete('/exam/:examId/:token', tokenController.removeAction);
app.get('/exams', examController.index);
app.get('/exam/:quizId', examController.viewExam);
app.delete('/exam/:quizId', examController.remove);
app.post('/exam/:quizId/:action', examController.questionActions);
app.post('/exams', examController.createAction);
app.get('/solve/:token', solveExamController.solve);
app.post('/solve/:token/data', solveExamController.getExamData);
app.post('/solve/:token/answer', solveExamController.answerAction);
app.post('/solve/:token/submitAnswers', solveExamController.submitAnswersAction);

app.get('/quiz', generatedQuizController.index);
app.post('/quiz/generate', generatedQuizController.generate);
app.get('/quiz/start', generatedQuizController.quiz);
app.post('/quiz/next', generatedQuizController.answerAction);

app.get('/categories', isUserAdmin, categoriesController.listAll);
app.get('/category/:id?', isUserAdmin, categoriesController.edit);
app.post('/category', isUserAdmin, categoriesController.actionCreate);
app.post('/category/:id', isUserAdmin, categoriesController.actionUpdate);
app.delete('/category/:id', isUserAdmin, categoriesController.actionDelete);

app.get('/settings', isUserAdmin, settingsController.index);
app.post('/settings', isUserAdmin, settingsController.update);

app.post('/redirects', async (req: express.Request, res: express.Response) => {
    req.session.redirectTo = req.body.return;
    await saveSession(req);
    res.json({});
});

app.get('/*', (req: express.Request, res: express.Response) => {
    res.render('error', { error: { message: 'Strona nie istnieje' } });
});

settingsCache.init().then(() => {
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    });
});
