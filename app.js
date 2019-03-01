const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');
const util = require('util');


mongoose.connect(config.database, {useCreateIndex: true, useNewUrlParser: true});
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
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
app.use(session({
    secret: 'keyboard',
    resave: true,
    saveUninitialized: true
}));

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

//Express validator Middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        let namespace = param.split('.')
            , root = namespace.shift()
            , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param: formParam,
            msg: msg,
            value: value
        };
    }
}));
//Passport Config
require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

//Set global for user
app.use(function (req, res, next) {
    res.locals.login = req.isAuthenticated();
    next();
});

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let appChat = require('./routes/app');

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', appChat);

let server = app.listen(3000, '0.0.0.0', function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('Server run on http://%s:%s/', host, port);
});

let usernames = [];
let rooms = ['Lobby'];
let test;

let io = require('socket.io')(server, {});
//listen on every connection
io.on('connection', function (socket) {

    socket.on('user_data', function (data) {
        socket.room = 'Lobby';
        socket.join('Lobby');
        socket.emit('updatechat', 'SERVER', 'you have connected to Lobby');
        socket.broadcast.to('Lobby').emit('updatechat', 'SERVER', data + ' has connected to this room');
        socket.emit('updaterooms', rooms, 'Lobby');

        socket.id = data.id;
        socket.username = data.name;
        test = socket.username = data.name;

        usernames.push(socket.username);
        updateUsernames();
    });

    socket.on('create', function (room) {
        rooms.push(room);
        socket.emit('updaterooms', rooms, socket.room);
    });

    socket.on('switchRoom', function (newroom) {
        var oldroom;
        oldroom = socket.room;
        socket.leave(socket.room);
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + newroom);
        socket.broadcast.to(oldroom).emit('updatechat', 'SERVER', socket.username + ' has left this room');
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username + ' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });

    function updateUsernames(){
        io.sockets.emit('usernames', usernames);
    }

    socket.on('new_message', (data) => {
        for(let i in usernames){
            io.sockets["in"](socket.room).emit('new_message', {message: data.message, username: usernames[i]});
        }
        //io.sockets.emit('new_message', {message: data.message, username: socket.username});
        //io.sockets["in"](socket.room).emit('new_message', {message: data.message, username: socket.username});
    });

    socket.on('typing', (data) => {
        //socket.broadcast.emit('typing', {username:socket.username, typing:data});
        socket.broadcast.to(socket.room).emit('typing', {username: socket.username, typing: data});
    });

    //Disconnect
    socket.on('disconnect', function (data) {
        if (!socket.username) {
            return;
        }

        usernames.splice(usernames.indexOf(socket.username), 1);
        updateUsernames();
        socket.leave(socket.room);
    })
});

module.exports = app;