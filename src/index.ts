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

app.get('/profile', profileController.index);
app.get('/questions/admin/pending', questionController.pendingIndex);
app.post('/question/admin/pending/:id', questionController.pendingAction);
app.get('/questions', questionController.index);
app.get('/question/create', questionController.create);
app.get('/question/upload', questionController.upload);
app.post('/question', fileUpload(), questionController.store);
app.post('/question/pending/:id', questionController.pending);
app.get('/question/:id', questionController.edit);
app.post('/question/:id', questionController.update);
app.delete('/question/:id', questionController.destroy);

app.get('/categories', categoriesController.index);
app.get('/category/:id?', categoriesController.edit);
app.post('/category', categoriesController.create);
app.post('/category/:id', categoriesController.update);
app.delete('/category/:id', categoriesController.delete);

app.get('/settings', settingsController.index);
app.post('/settings', settingsController.update);

settingsCache.init().then(() => {
    app.listen(port, () => {
        console.log(`Server started at http://localhost:${port}`);
    });
});
