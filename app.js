const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const expressValidator =  require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');

mongoose.connect(config.database,{ useNewUrlParser: true });
let db = mongoose.connection;

//Check connection
db.once('open', function () {
    console.log('connect to db');
});
//Check for db errors
db.on('error', function (error) {
    console.log(error);
});

let app = express();
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'test',
    resave:true,
    saveUninitialized: true,
}));
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});
//Express validator Middleware
app.use(expressValidator({
    errorFormatter: function(param, msg, value) {
        var namespace = param.split('.')
            , root    = namespace.shift()
            , formParam = root;

        while(namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg   : msg,
            value : value
        };
    }
}));
//Passport Config
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

app.get('*', function (req, res, next) {
    res.locals.users = req.user || null;
    next();
});

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');

app.use('/', indexRouter);
app.use('/users', usersRouter);

let server = app.listen(3000, '0.0.0.0', function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server run on http://%s:%s/', host, port);
});

module.exports = app;