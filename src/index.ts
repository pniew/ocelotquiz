import express from 'express';
import exphbs from 'express-handlebars';
// import mysqlSession from 'express-mysql-session';
import methodOverride from 'method-override';
import session from 'express-session';
import path from 'path';
import indexController from 'controllers/indexController';
import profileController from 'controllers/profileController';
import pool from 'common/database';

// const MySQLStore = mysqlSession(session);
var MySQLStore = require('express-mysql-session')(session);

const port = process.env.SERVER_PORT;
const app = express();

app.engine('handlebars', exphbs({
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

app.use((req, res, next) => {
    if (req.session.loggedIn) {
        next();
    } else {
        res.redirect('/login');
    }
});

app.get('/profile', profileController.index);

