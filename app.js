const express = require('express');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const session = require('express-session');

/**
 * ===================================
 * Configurations and set up
 * ===================================
 */

// Init express app
const app = express();

// Set up middleware
app.use(methodOverride('_method'));

app.use(cookieParser());

app.use(express.static('public'));

app.use(express.json());

app.use(express.urlencoded({
    extended: true
}));

// Set react-views to be the default view engine
const reactEngine = require('express-react-views').createEngine();

app.set('views', __dirname + '/views');
app.set('view engine', 'jsx');
app.engine('jsx', reactEngine);

// Set session and authentication routes. User remains on auth routes until validated/logged in.
app.use(session({
    secret: 'tunr!secret',
    resave: false,
    saveUninitialized: false,
    name: 'sid',
    cookie: {
        maxAge: 86400000,
        sameSite: true
    }
}))

const db = require('./db');
const authController = require('./controllers/auth-controller');
const authRoutes = require('./routes/auth-routes');

app.use('/auth', authRoutes);

app.use('/', async (req, res, next) => {

    if (req.session.userId) {

        req.currentUser = await authController.getUserInfo(req.session.userId);

    }

    next();
})


app.get('/', async (req, res) => {

    //redirect to homepage with auth routes if user is not logged in

    if (req.session.userId) {

        req.currentUser = await authController.getUserInfo(req.session.userId);

        res.cookie('userId', req.session.userId);

        await authController.visitsCookieCounter(req, res);

        res.render('home', { 'currentUser': req.currentUser });

    } else {

        res.redirect('/auth');

    }

});

/**
 * ===================================
 * ===================================
 *                DB
 * ===================================
 * ===================================
 */



/**
 * ===================================
 * Listen to requests on port 3000
 * ===================================
 */
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => console.log('~~~ Tuning in to the waves of port ' + PORT + ' ~~~'));

let onClose = function() {

    server.close(async () => {
        await db.poolEnd();
        console.log('Process terminated')
    })
};

process.on('SIGTERM', onClose);
process.on('SIGINT', onClose);