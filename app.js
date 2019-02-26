const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const expressValidator =  require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');

mongoose.connect('mongodb://localhost/chatdb');
let db = mongoose.connection;

//Check connection
db.once('open', function () {
    console.log('connect to db');
});

//Check for db errors
db.on('error', function (error) {
    console.log(error);
});


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

//app.use('/client', express.static(path.join(__dirname + 'client')));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'blade');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use(session({
    secret: 'test',
    resave:false,
    saveUninitialized: true,
    cookie: {secure:true}
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

let server = app.listen(3000, '0.0.0.0', function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server run on http://%s:%s/', host, port);
});

module.exports = app;